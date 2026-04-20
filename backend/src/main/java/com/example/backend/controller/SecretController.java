package com.example.backend.controller;

import com.example.backend.entity.Secret;
import com.example.backend.repository.SecretRepository;
import com.example.backend.security.EncryptionService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/secrets")
public class SecretController {

    private final SecretRepository secretRepository;
    private final EncryptionService encryptionService;

    public SecretController(SecretRepository secretRepository, EncryptionService encryptionService) {
        this.secretRepository = secretRepository;
        this.encryptionService = encryptionService;
    }

    @PostMapping
    public Secret createSecret(@RequestBody Secret secret) throws Exception {
        String encryptedValue = encryptionService.encrypt(secret.getSecretValue());
        secret.setSecretValue(encryptedValue);
        return secretRepository.save(secret);
    }

    // NEW: Get all secrets and decrypt them for the user
    @GetMapping
    public List<Secret> getAllSecrets() {
        return secretRepository.findAll().stream().map(secret -> {
            try {
                String decrypted = encryptionService.decrypt(secret.getSecretValue());
                secret.setSecretValue(decrypted);
                return secret;
            } catch (Exception e) {
                // If decryption fails, we show the encrypted value or an error
                secret.setSecretValue("DECRYPTION_ERROR");
                return secret;
            }
        }).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public Secret getSecret(@PathVariable UUID id) throws Exception {
        Secret secret = secretRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Secret not found"));

        // Decrypt before sending to Postman
        secret.setSecretValue(encryptionService.decrypt(secret.getSecretValue()));

        return secret;
    }
}