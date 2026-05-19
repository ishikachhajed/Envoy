package com.example.backend.service;

import com.example.backend.dto.*;
import com.example.backend.entity.Membership;
import com.example.backend.entity.Organization;
import com.example.backend.entity.User;
import com.example.backend.enums.Role;
import com.example.backend.repository.MembershipRepository;
import com.example.backend.repository.OrganizationRepository;
import com.example.backend.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
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

    public OrganizationService(OrganizationRepository organizationRepository,
            MembershipRepository membershipRepository,
            UserRepository userRepository) {
        this.organizationRepository = organizationRepository;
        this.membershipRepository = membershipRepository;
        this.userRepository = userRepository;
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

    /**
     * Adds a new user to a team. Only team ADMINs can call this.
     */
    @Transactional
    public void addMember(UUID orgId, AddMemberRequestDTO request) {
        User requester = getCurrentUser();

        // 1. Permission Check
        Membership requesterMembership = membershipRepository.findByUserIdAndOrganizationId(requester.getId(), orgId)
                .orElseThrow(() -> new RuntimeException("You are not a member of this organization."));

        if (requesterMembership.getRole() != Role.ADMIN) {
            throw new RuntimeException("Only Admins can add members.");
        }

        // 2. Add Member
        User targetUser = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found: " + request.getEmail()));

        Membership newMembership = new Membership();
        newMembership.setUser(targetUser);
        newMembership.setOrganization(requesterMembership.getOrganization());
        newMembership.setRole(request.getRole());
        membershipRepository.save(newMembership);
    }

    /**
     * List all members of a specific team.
     */
    @Transactional(readOnly = true)
    public List<MemberResponseDTO> getOrganizationMembers(UUID orgId) {
        List<Membership> memberships = membershipRepository.findByOrganizationId(orgId);

        return memberships.stream()
                .map(m -> new MemberResponseDTO(
                        m.getId(),
                        m.getUser().getName(),
                        m.getUser().getEmail(),
                        m.getRole(),
                        m.getJoinedAt()))
                .collect(Collectors.toList());
    }
}
