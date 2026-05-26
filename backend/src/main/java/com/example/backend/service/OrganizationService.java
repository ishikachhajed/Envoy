package com.example.backend.service;

import com.example.backend.dto.*;
import com.example.backend.entity.Membership;
import com.example.backend.entity.Organization;
import com.example.backend.entity.User;
import com.example.backend.enums.Role;
import com.example.backend.repository.InvitationRepository;
import com.example.backend.repository.MembershipRepository;
import com.example.backend.repository.OrganizationRepository;
import com.example.backend.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * OrganizationService: The core logic engine for multi-tenancy.
 * Handles organization creation, team memberships, and role-based permissions.
 */
@Service
public class OrganizationService {
    private final OrganizationRepository organizationRepository;
    private final MembershipRepository membershipRepository;
    private final UserRepository userRepository;
    private final com.example.backend.repository.InvitationRepository invitationRepository;
    private final EmailService emailService;

    public OrganizationService(OrganizationRepository organizationRepository,
            MembershipRepository membershipRepository,
             UserRepository userRepository,
            com.example.backend.repository.InvitationRepository invitationRepository,
            EmailService emailService) {
        this.organizationRepository = organizationRepository;
        this.membershipRepository = membershipRepository;
        this.userRepository = userRepository;
        this.invitationRepository = invitationRepository;
        this.emailService = emailService;
    }

    /**
     * Helper: Identifies the logged-in user from the JWT token in the
     * SecurityContext.
     */
    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found."));
    }

    /**
     * Create a new team. Automatically assigns the creator as ADMIN.
     */
    @Transactional
    public OrgResponseDTO createOrganization(CreateOrgRequestDTO request) {
        User creator = getCurrentUser();

        // Create Org
        Organization org = new Organization();
        org.setName(request.getName());
        org.setSlug(request.getName().toLowerCase().replaceAll(" ", "-"));
        Organization savedOrg = organizationRepository.save(org);

        // Create Membership (Creator = Admin)
        Membership membership = new Membership();
        membership.setUser(creator);
        membership.setOrganization(savedOrg);
        membership.setRole(Role.ADMIN);
        membershipRepository.save(membership);

        return new OrgResponseDTO(savedOrg.getId(), savedOrg.getName(), savedOrg.getSlug(), savedOrg.getCreatedAt());
    }

    /**
     * List all teams the current user belongs to.
     */
    @Transactional(readOnly = true)
    public List<OrgResponseDTO> getOrganizationsForUser() {
        User user = getCurrentUser();
        List<Membership> memberships = membershipRepository.findByUserId(user.getId());

        return memberships.stream() // stream allows FILTERING , MAPPING , TRANSFORMING
                .map(m -> {
                    Organization org = m.getOrganization();
                    return new OrgResponseDTO(org.getId(), org.getName(), org.getSlug(), org.getCreatedAt());
                })
                .collect(Collectors.toList());
    }

     //Invites a new user to a team. Only team ADMINs can call this.
    @Transactional
    public void addMember(UUID orgId, AddMemberRequestDTO request) {
        User requester = getCurrentUser();

        // 1. Permission Check
        Membership requesterMembership = membershipRepository.findByUserIdAndOrganizationId(requester.getId(), orgId)
                .orElseThrow(() -> new RuntimeException("You are not a member of this organization."));

        if (requesterMembership.getRole() != Role.ADMIN) {
            throw new RuntimeException("Only Admins can invite members.");
        }

        /// 2. Check if already a member
        Optional<User> targetUserOpt = userRepository.findByEmail(request.getEmail());
        if (targetUserOpt.isPresent()) {
            Optional<Membership> existing = membershipRepository.findByUserIdAndOrganizationId(targetUserOpt.get().getId(), orgId);
            if (existing.isPresent()) {
                throw new RuntimeException("User is already a member of this organization.");
            }
        }

        // 3. Create or update pending invite
        Organization org = requesterMembership.getOrganization();
        com.example.backend.entity.Invitation invite = invitationRepository
            .findByEmailAndOrganizationIdAndAcceptedFalse(request.getEmail(), orgId)
            .orElse(new com.example.backend.entity.Invitation());
        invite.setEmail(request.getEmail());
        invite.setOrganization(org);
        invite.setRole(request.getRole());
        invite.setToken(UUID.randomUUID().toString());
        invite.setExpiresAt(LocalDateTime.now().plusDays(7));
        invitationRepository.save(invite);
        // 4. Send email
        String inviteUrl = "http://localhost:3000/invite?token=" + invite.getToken() + "&email=" + request.getEmail();
        emailService.sendOrganizationInviteEmail(request.getEmail(), org.getName(), inviteUrl);
    }

    /**
     * List all members of a specific team.
     */
    @Transactional(readOnly = true)
    public List<MemberResponseDTO> getOrganizationMembers(UUID orgId) {
        List<Membership> memberships = membershipRepository.findByOrganizationId(orgId);

        return memberships.stream()
    .map(m -> new MemberResponseDTO(
        m.getId(),                // membershipId
        m.getUser().getId(),      // userId  <-- ADD THIS
        m.getUser().getName(),
        m.getUser().getEmail(),
        m.getRole(),
        m.getJoinedAt()))
    .collect(Collectors.toList());
    }
    /**
     * Changes a member's role. Only team ADMINs can call this.
     */
    @Transactional
    public void changeMemberRole(UUID orgId, UUID memberId, Role newRole) {
        User requester = getCurrentUser();
        Membership requesterMembership = membershipRepository.findByUserIdAndOrganizationId(requester.getId(), orgId)
                .orElseThrow(() -> new RuntimeException("You are not a member of this organization."));
        if (requesterMembership.getRole() != Role.ADMIN) {
            throw new RuntimeException("Only Admins can change roles.");
        }
        Membership targetMembership = membershipRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Membership not found."));
                
        if (!targetMembership.getOrganization().getId().equals(orgId)) {
            throw new RuntimeException("Membership does not belong to this organization.");
        }
        // Prevent admin from demoting themselves if they are the only admin
        if (targetMembership.getUser().getId().equals(requester.getId()) && newRole != Role.ADMIN) {
            long adminCount = membershipRepository.findByOrganizationId(orgId).stream()
                .filter(m -> m.getRole() == Role.ADMIN)
                .count();
            if (adminCount <= 1) {
                throw new RuntimeException("Cannot demote the only admin of the organization.");
            }
        }
        targetMembership.setRole(newRole);
        membershipRepository.save(targetMembership);
    }
    /**
     * Removes a member from the team. Only team ADMINs can call this.
     */
    @Transactional
    public void removeMember(UUID orgId, UUID memberId) {
        User requester = getCurrentUser();
        Membership requesterMembership = membershipRepository.findByUserIdAndOrganizationId(requester.getId(), orgId)
                .orElseThrow(() -> new RuntimeException("You are not a member of this organization."));
        if (requesterMembership.getRole() != Role.ADMIN) {
            throw new RuntimeException("Only Admins can remove members.");
        }
        Membership targetMembership = membershipRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Membership not found."));
                
        if (!targetMembership.getOrganization().getId().equals(orgId)) {
            throw new RuntimeException("Membership does not belong to this organization.");
        }
        // Prevent admin from removing themselves if they are the only admin
        if (targetMembership.getUser().getId().equals(requester.getId())) {
            long adminCount = membershipRepository.findByOrganizationId(orgId).stream()
                .filter(m -> m.getRole() == Role.ADMIN)
                .count();
            if (adminCount <= 1) {
                throw new RuntimeException("Cannot remove the only admin of the organization.");
            }
        }
        membershipRepository.delete(targetMembership);
    }
    /**
     * Get pending invitations for the team.
     */
    @Transactional(readOnly = true)
    public List<InvitationResponseDTO> getPendingInvitations(UUID orgId) {
        return invitationRepository.findByOrganizationIdAndAcceptedFalse(orgId)
            .stream()
            .map(inv -> new InvitationResponseDTO(
                inv.getId(),
                inv.getEmail(),
                inv.getRole(),
                inv.getExpiresAt(),
                inv.getCreatedAt()
            ))
            .collect(Collectors.toList());
    }
    /**
     * Accepts an invitation.
     */
    @Transactional
    public void acceptInvitation(String token) {
        com.example.backend.entity.Invitation invite = invitationRepository.findByToken(token)
            .orElseThrow(() -> new RuntimeException("Invalid or expired invitation token."));
        User user = getCurrentUser();

        if (invite.isAccepted()) {
            Optional<Membership> existing = membershipRepository.findByUserIdAndOrganizationId(
                user.getId(), 
                invite.getOrganization().getId()
            );
            if (existing.isPresent()) {
                return; // Already accepted and user is a member, handle gracefully
            }
            throw new RuntimeException("Invitation already accepted.");
        }
        if (invite.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Invitation expired.");
        }

        if (!user.getEmail().equalsIgnoreCase(invite.getEmail())) {
            throw new RuntimeException("This invitation was sent to a different email address.");
        }
        // Check if already a member (handles React Strict Mode double-firing)
        Optional<Membership> existing = membershipRepository.findByUserIdAndOrganizationId(
            user.getId(), 
            invite.getOrganization().getId()
        );
        if (existing.isEmpty()) {
            // Add member
            Membership newMembership = new Membership();
            newMembership.setUser(user);
            newMembership.setOrganization(invite.getOrganization());
            newMembership.setRole(invite.getRole());
            try {
                membershipRepository.save(newMembership);
            } catch (org.springframework.dao.DataIntegrityViolationException e) {
                // Ignore if another thread just inserted it
            }
        }
        // Mark accepted
        invite.setAccepted(true);
        invitationRepository.save(invite);
    }
}
