package com.example.backend.service;

import com.example.backend.dto.CreateSecretRequestDTO;
import com.example.backend.dto.SecretResponseDTO;
import com.example.backend.entity.Environment;
import com.example.backend.entity.Membership;
import com.example.backend.entity.Secret;
import com.example.backend.entity.User;
import com.example.backend.enums.AuditAction;
import com.example.backend.enums.Role;
import com.example.backend.exception.CustomAccessDeniedException;
import com.example.backend.repository.EnvironmentRepository;
import com.example.backend.repository.MembershipRepository;
import com.example.backend.repository.SecretRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.security.EncryptionService;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * SecretService: Handles tenant isolation context, encryption writes, 
 * and AES-GCM-256 decryption reads for environment secrets.
 * Enforces strict Role-Based Access Control (RBAC) key masking and delete gates.
 * Seamlessly emits immutable transactional history entries via AuditLogService.
 */
@Service
public class SecretService {

    private final SecretRepository secretRepository;
    private final EnvironmentRepository environmentRepository;
    private final MembershipRepository membershipRepository;
    private final UserRepository userRepository;
    private final EncryptionService encryptionService;
    private final AuditLogService auditLogService;

    public SecretService(SecretRepository secretRepository,
                         EnvironmentRepository environmentRepository,
                         MembershipRepository membershipRepository,
                         UserRepository userRepository,
                         EncryptionService encryptionService,
                         AuditLogService auditLogService) {
        this.secretRepository = secretRepository;
        this.environmentRepository = environmentRepository;
        this.membershipRepository = membershipRepository;
        this.userRepository = userRepository;
        this.encryptionService = encryptionService;
        this.auditLogService = auditLogService;
    }

    /**
     * Creates and encrypts a new secret within a specific environment.
     */
    @Transactional
    public SecretResponseDTO createSecret(UUID envId, CreateSecretRequestDTO dto) {
        User currentUser = getCurrentUser();
        Environment environment = environmentRepository.findById(envId)
                .orElseThrow(() -> new RuntimeException("Environment not found."));

        // Trace ownership up to Organization level and check membership
        validateEnvironmentAccess(environment, currentUser.getId());
        UUID orgId = environment.getProject().getOrganization().getId();

        try {
            // Encrypt secret value using secure AES-GCM-256
            EncryptionService.EncryptedResult encrypted = encryptionService.encrypt(dto.getValue());

            Secret secret = new Secret();
            secret.setSecretKey(dto.getKey());
            secret.setSecretValue(encrypted.getCiphertext());
            secret.setIv(encrypted.getIv());
            secret.setEnvironment(environment);

            Secret saved = secretRepository.save(secret);

            // SOC2 Audit Trail
            auditLogService.recordLog(
                    currentUser.getEmail(),
                    AuditAction.SECRET_CREATE,
                    orgId,
                    "Created secret '" + dto.getKey() + "' in Environment '" + environment.getName() + "' (Project: " + environment.getProject().getName() + ")"
            );

            return new SecretResponseDTO(
                    saved.getId(),
                    saved.getSecretKey(),
                    dto.getValue(), // Return plaintext on creation for immediate developer display
                    saved.getCreatedAt(),
                    saved.getUpdatedAt()
            );
        } catch (Exception e) {
            throw new RuntimeException("Encryption failure: Could not store secret securely.", e);
        }
    }

    /**
     * Lists all secrets belonging to a specific environment.
     * Supports both Human Users (RBAC) and Service Tokens (Automated Servers).
     */
    @Transactional(readOnly = true)
    public List<SecretResponseDTO> getSecretsByEnvironment(UUID envId) {
        // 1. Check if the request is from an Automated Server using a Service Token
        org.springframework.security.core.Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isServiceToken = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SERVICE_TOKEN"));

        if (isServiceToken) {
            // It's a server! Check if the token is allowed to access THIS environment
            String tokenIdentity = auth.getName(); // e.g., "service-token:1234-5678-..."
            String allowedEnvId = tokenIdentity.split(":")[1];

            if (!allowedEnvId.equals(envId.toString())) {
                throw new CustomAccessDeniedException("Access Denied: This service token is not authorized for this environment.");
            }

            // Since it's a valid service token for this environment, return all decrypted secrets
            return fetchAndDecryptSecrets(envId, true);
        }

        // 2. It's a Human User. Fall back to standard RBAC checks.
        User currentUser = getCurrentUser();
        Environment environment = environmentRepository.findById(envId)
                .orElseThrow(() -> new RuntimeException("Environment not found."));

        // Trace ownership and return membership to check role
        Membership membership = validateEnvironmentAccess(environment, currentUser.getId());
        boolean isAdmin = membership.getRole() == Role.ADMIN;
        boolean isDevelopment = environment.getName().equalsIgnoreCase("development");

        // Return secrets. If Admin OR if it's the Development environment, decrypt them.
        // Members cannot see decrypted values for Staging/Production.
        boolean shouldDecrypt = isAdmin || isDevelopment;
        
        return fetchAndDecryptSecrets(envId, shouldDecrypt);
    }

    /**
     * Helper method to fetch and optionally decrypt secrets.
     */
    private List<SecretResponseDTO> fetchAndDecryptSecrets(UUID envId, boolean decrypt) {
        List<Secret> secrets = secretRepository.findByEnvironmentId(envId);

        return secrets.stream()
                .map(s -> {
                    try {
                        String displayValue = "••••••••••••";
                        if (decrypt) {
                            displayValue = encryptionService.decrypt(s.getSecretValue(), s.getIv());
                        }

                        return new SecretResponseDTO(
                                s.getId(),
                                s.getSecretKey(),
                                displayValue,
                                s.getCreatedAt(),
                                s.getUpdatedAt()
                        );
                    } catch (Exception e) {
                        throw new RuntimeException("Decryption failure for key: " + s.getSecretKey(), e);
                    }
                })
                .collect(Collectors.toList());
    }

    /**
     * Decrypts and reveals a single specific secret on-demand.
     * Accessible only to ADMIN roles.
     */
    @Transactional(readOnly = true)
    public SecretResponseDTO revealSecret(UUID secretId) {
        User currentUser = getCurrentUser();
        Secret secret = secretRepository.findById(secretId)
                .orElseThrow(() -> new RuntimeException("Secret not found."));

        // Trace ownership and check ADMIN permission
        Membership membership = validateEnvironmentAccess(secret.getEnvironment(), currentUser.getId());
        UUID orgId = secret.getEnvironment().getProject().getOrganization().getId();

        if (membership.getRole() != Role.ADMIN) {
            throw new CustomAccessDeniedException("Access Denied: Only Admins are authorized to reveal decrypted secret values.");
        }

        try {
            String decryptedVal = encryptionService.decrypt(secret.getSecretValue(), secret.getIv());

            // SOC2 Audit Trail
            auditLogService.recordLog(
                    currentUser.getEmail(),
                    AuditAction.SECRET_REVEAL,
                    orgId,
                    "Revealed plain secret value for key '" + secret.getSecretKey() + "' in Environment '" + secret.getEnvironment().getName() + "'"
            );

            return new SecretResponseDTO(
                    secret.getId(),
                    secret.getSecretKey(),
                    decryptedVal,
                    secret.getCreatedAt(),
                    secret.getUpdatedAt()
            );
        } catch (Exception e) {
            throw new RuntimeException("Decryption failure for key: " + secret.getSecretKey(), e);
        }
    }

    /**
     * Deletes a secret from the environment database.
     * Enforces Admin-only restriction.
     */
    @Transactional
    public void deleteSecret(UUID secretId) {
        User currentUser = getCurrentUser();
        Secret secret = secretRepository.findById(secretId)
                .orElseThrow(() -> new RuntimeException("Secret not found."));

        // Trace ownership and verify Admin permissions
        Membership membership = validateEnvironmentAccess(secret.getEnvironment(), currentUser.getId());
        UUID orgId = secret.getEnvironment().getProject().getOrganization().getId();

        if (membership.getRole() != Role.ADMIN) {
            throw new CustomAccessDeniedException("Access Denied: Only Admins are authorized to delete environment secrets.");
        }

        secretRepository.delete(secret);

        // SOC2 Audit Trail
        auditLogService.recordLog(
                currentUser.getEmail(),
                AuditAction.SECRET_DELETE,
                orgId,
                "Deleted secret '" + secret.getSecretKey() + "' from Environment '" + secret.getEnvironment().getName() + "'"
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
