package com.example.backend.service;

import com.example.backend.dto.CreateSecretRequestDTO;
import com.example.backend.dto.SecretResponseDTO;
import com.example.backend.entity.Environment;
import com.example.backend.entity.Secret;
import com.example.backend.entity.User;
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
 */
@Service
public class SecretService {

    private final SecretRepository secretRepository;
    private final EnvironmentRepository environmentRepository;
    private final MembershipRepository membershipRepository;
    private final UserRepository userRepository;
    private final EncryptionService encryptionService;

    public SecretService(SecretRepository secretRepository,
                         EnvironmentRepository environmentRepository,
                         MembershipRepository membershipRepository,
                         UserRepository userRepository,
                         EncryptionService encryptionService) {
        this.secretRepository = secretRepository;
        this.environmentRepository = environmentRepository;
        this.membershipRepository = membershipRepository;
        this.userRepository = userRepository;
        this.encryptionService = encryptionService;
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

        try {
            // Encrypt secret value using secure AES-GCM-256
            EncryptionService.EncryptedResult encrypted = encryptionService.encrypt(dto.getValue());

            Secret secret = new Secret();
            secret.setSecretKey(dto.getKey());
            secret.setSecretValue(encrypted.getCiphertext());
            secret.setIv(encrypted.getIv());
            secret.setEnvironment(environment);

            Secret saved = secretRepository.save(secret);

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
     * Lists all secrets belonging to a specific environment, decrypted on the fly.
     */
    @Transactional(readOnly = true)
    public List<SecretResponseDTO> getSecretsByEnvironment(UUID envId) {
        User currentUser = getCurrentUser();
        Environment environment = environmentRepository.findById(envId)
                .orElseThrow(() -> new RuntimeException("Environment not found."));

        // Trace ownership up to Organization level and check membership
        validateEnvironmentAccess(environment, currentUser.getId());

        List<Secret> secrets = secretRepository.findByEnvironmentId(envId);

        return secrets.stream()
                .map(s -> {
                    try {
                        // Decrypt ciphertext using its corresponding random IV
                        String decryptedVal = encryptionService.decrypt(s.getSecretValue(), s.getIv());
                        return new SecretResponseDTO(
                                s.getId(),
                                s.getSecretKey(),
                                decryptedVal,
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
     * Deletes a secret from the environment database.
     */
    @Transactional
    public void deleteSecret(UUID secretId) {
        User currentUser = getCurrentUser();
        Secret secret = secretRepository.findById(secretId)
                .orElseThrow(() -> new RuntimeException("Secret not found."));

        // Trace ownership up to Organization level and check membership
        validateEnvironmentAccess(secret.getEnvironment(), currentUser.getId());

        secretRepository.delete(secret);
    }

    // --- Core Multi-Tenant Helpers ---

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Logged in user not found."));
    }

    private void validateEnvironmentAccess(Environment environment, UUID userId) {
        UUID orgId = environment.getProject().getOrganization().getId();
        membershipRepository.findByUserIdAndOrganizationId(userId, orgId)
                .orElseThrow(() -> new RuntimeException("Access Denied: You are not a member of this organization."));
    }
}
