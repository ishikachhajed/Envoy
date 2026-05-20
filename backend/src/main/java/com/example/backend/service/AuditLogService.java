package com.example.backend.service;

import com.example.backend.entity.AuditLog;
import com.example.backend.entity.Membership;
import com.example.backend.entity.User;
import com.example.backend.enums.AuditAction;
import com.example.backend.enums.Role;
import com.example.backend.exception.CustomAccessDeniedException;
import com.example.backend.repository.AuditLogRepository;
import com.example.backend.repository.MembershipRepository;
import com.example.backend.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * AuditLogService: Orchestrates the secure persistence of audit histories 
 * and handles admin-restricted retrieval gates.
 */
@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final MembershipRepository membershipRepository;
    private final UserRepository userRepository;

    public AuditLogService(AuditLogRepository auditLogRepository,
                           MembershipRepository membershipRepository,
                           UserRepository userRepository) {
        this.auditLogRepository = auditLogRepository;
        this.membershipRepository = membershipRepository;
        this.userRepository = userRepository;
    }
    @Transactional
    public void recordLog(String actorEmail, AuditAction action, UUID orgId, String details) {
        AuditLog log = new AuditLog();
        log.setActorEmail(actorEmail);
        log.setAction(action);
        log.setOrganizationId(orgId);
        log.setDetails(details);
        auditLogRepository.save(log);
    }

    /**
     * Retrieves audit logs for an organization. Restricted strictly to ADMINs.
     */
    @Transactional(readOnly = true)
    public List<AuditLog> getAuditLogs(UUID orgId) {
        User currentUser = getCurrentUser();
        Membership membership = membershipRepository.findByUserIdAndOrganizationId(currentUser.getId(), orgId)
                .orElseThrow(() -> new CustomAccessDeniedException("Access Denied: You are not a member of this organization."));

        if (membership.getRole() != Role.ADMIN) {
            throw new CustomAccessDeniedException("Access Denied: Only Admins are authorized to view organization audit logs.");
        }

        return auditLogRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId);
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Logged in user not found."));
    }
}
