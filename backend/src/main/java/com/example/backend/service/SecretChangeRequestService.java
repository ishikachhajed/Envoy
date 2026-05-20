package com.example.backend.service;

import com.example.backend.dto.CreateSecretRequestDTO;
import com.example.backend.dto.SecretChangeRequestResponseDTO;
import com.example.backend.entity.*;
import com.example.backend.enums.AuditAction;
import com.example.backend.enums.RequestStatus;
import com.example.backend.enums.Role;
import com.example.backend.exception.CustomAccessDeniedException;
import com.example.backend.repository.*;
import com.example.backend.security.EncryptionService;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * SecretChangeRequestService: Implements approval loop logic for change requests,
 * including GCM cipher copying on Admin approval.
 */
@Service
public class SecretChangeRequestService {

    private final SecretChangeRequestRepository changeRequestRepository;
    private final EnvironmentRepository environmentRepository;
    private final MembershipRepository membershipRepository;
    private final UserRepository userRepository;
    private final SecretRepository secretRepository;
    private final EncryptionService encryptionService;
    private final AuditLogService auditLogService;

    public SecretChangeRequestService(SecretChangeRequestRepository changeRequestRepository,
                                     EnvironmentRepository environmentRepository,
                                     MembershipRepository membershipRepository,
                                     UserRepository userRepository,
                                     SecretRepository secretRepository,
                                     EncryptionService encryptionService,
                                     AuditLogService auditLogService) {
        this.changeRequestRepository = changeRequestRepository;
        this.environmentRepository = environmentRepository;
        this.membershipRepository = membershipRepository;
        this.userRepository = userRepository;
        this.secretRepository = secretRepository;
        this.encryptionService = encryptionService;
        this.auditLogService = auditLogService;
    }

    //Submits a new change request. Accessible to both Admins and Members.
    @Transactional
    public SecretChangeRequestResponseDTO createChangeRequest(UUID envId, CreateSecretRequestDTO dto) {
        User currentUser = getCurrentUser();
        Environment environment = environmentRepository.findById(envId)
                .orElseThrow(() -> new RuntimeException("Environment not found."));

        // Trace and check organization membership access
        validateEnvironmentAccess(environment, currentUser.getId());
        UUID orgId = environment.getProject().getOrganization().getId();

        try {
            // Encrypt secret value using secure AES-GCM-256 for request storage
            EncryptionService.EncryptedResult encrypted = encryptionService.encrypt(dto.getValue());

            SecretChangeRequest request = new SecretChangeRequest();
            request.setEnvironment(environment);
            request.setSecretKey(dto.getKey());
            request.setSecretValue(encrypted.getCiphertext());
            request.setIv(encrypted.getIv());
            request.setRequester(currentUser);
            request.setStatus(RequestStatus.PENDING);
            request.setReason(dto.getReason());

            SecretChangeRequest saved = changeRequestRepository.save(request);

            // SOC2 Audit Trail
            auditLogService.recordLog(
                    currentUser.getEmail(),
                    AuditAction.SECRET_CHANGE_REQUESTED,
                    orgId,
                    "Requested secret modification for '" + dto.getKey() + "' in Environment '" + environment.getName() + "'"
            );

            return convertToDTO(saved);
        } catch (Exception e) {
            throw new RuntimeException("Failed to register change request.", e);
        }
    }
    @Transactional(readOnly = true)
    public List<SecretChangeRequestResponseDTO> listChangeRequests(UUID envId) {
        User currentUser = getCurrentUser();
        Environment environment = environmentRepository.findById(envId)
                .orElseThrow(() -> new RuntimeException("Environment not found."));

        validateEnvironmentAccess(environment, currentUser.getId());

        List<SecretChangeRequest> requests = changeRequestRepository.findByEnvironmentIdOrderByCreatedAtDesc(envId);
        return requests.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    /**
     * Approves or Rejects a pending secret change request. Restricted to ADMINs.
     */
    @Transactional
    public SecretChangeRequestResponseDTO resolveRequest(UUID requestId, String action) {
        User currentUser = getCurrentUser();
        SecretChangeRequest request = changeRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Change request not found."));

        Environment environment = request.getEnvironment();
        Membership membership = validateEnvironmentAccess(environment, currentUser.getId());
        UUID orgId = environment.getProject().getOrganization().getId();

        if (membership.getRole() != Role.ADMIN) {
            throw new CustomAccessDeniedException("Access Denied: Only Admins are authorized to approve or reject secret change requests.");
        }

        if (request.getStatus() != RequestStatus.PENDING) {
            throw new RuntimeException("Change request is already resolved.");
        }

        if ("APPROVE".equalsIgnoreCase(action)) {
            request.setStatus(RequestStatus.APPROVED);

            // Fetch or create the actual Secret in the environment
            Secret secret = secretRepository.findByEnvironmentId(environment.getId()).stream()
                    .filter(s -> s.getSecretKey().equalsIgnoreCase(request.getSecretKey()))
                    .findFirst()
                    .orElse(new Secret());

            secret.setSecretKey(request.getSecretKey());
            secret.setSecretValue(request.getSecretValue()); // Use GCM Ciphertext from request
            secret.setIv(request.getIv());                 // Use GCM IV from request
            secret.setEnvironment(environment);

            secretRepository.save(secret);

            // SOC2 Audit Trail
            auditLogService.recordLog(
                    currentUser.getEmail(),
                    AuditAction.SECRET_CHANGE_APPROVED,
                    orgId,
                    "Approved secret change for '" + request.getSecretKey() + "' in Environment '" + environment.getName() + "'"
            );

        } else if ("REJECT".equalsIgnoreCase(action)) {
            request.setStatus(RequestStatus.REJECTED);

            // SOC2 Audit Trail
            auditLogService.recordLog(
                    currentUser.getEmail(),
                    AuditAction.SECRET_CHANGE_REJECTED,
                    orgId,
                    "Rejected secret change for '" + request.getSecretKey() + "' in Environment '" + environment.getName() + "'"
            );
        } else {
            throw new RuntimeException("Invalid resolution action. Use APPROVE or REJECT.");
        }

        request.setResolver(currentUser);
        request.setResolvedAt(LocalDateTime.now());

        SecretChangeRequest saved = changeRequestRepository.save(request);
        return convertToDTO(saved);
    }

    private SecretChangeRequestResponseDTO convertToDTO(SecretChangeRequest request) {
        String resolverEmail = request.getResolver() != null ? request.getResolver().getEmail() : null;
        return new SecretChangeRequestResponseDTO(
                request.getId(),
                request.getSecretKey(),
                "••••••••••••", // Shield decrypted value in default lists
                request.getRequester().getEmail(),
                request.getStatus(),
                resolverEmail,
                request.getCreatedAt(),
                request.getResolvedAt(),
                request.getReason()
        );
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Logged in user not found."));
    }

    private Membership validateEnvironmentAccess(Environment environment, UUID userId) {
        UUID orgId = environment.getProject().getOrganization().getId();
        return membershipRepository.findByUserIdAndOrganizationId(userId, orgId)
                .orElseThrow(() -> new CustomAccessDeniedException("Access Denied: You are not a member of this organization."));
    }
}
