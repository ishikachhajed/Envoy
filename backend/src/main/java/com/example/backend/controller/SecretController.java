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
    @DeleteMapping("/{id}")
    public String deleteSecret(@PathVariable UUID id) {
    return secretRepository.findById(id)
            .map(secret -> {
                secretRepository.delete(secret);
                return "Secret with ID " + id + " has been successfully deleted.";
            })
            .orElseThrow(() -> new RuntimeException("Secret not found with id: " + id));
    }
    // GET: Search secrets by name
// URL: /api/secrets/search?key=DATABASE
    @GetMapping("/search")
    public List<Secret> searchSecrets(@RequestParam String key) {
        return secretRepository.findBySecretKeyContainingIgnoreCase(key).stream()
            .map(secret -> {
                try {
                    String decrypted = encryptionService.decrypt(secret.getSecretValue());
                    secret.setSecretValue(decrypted);
                    return secret;
                } catch (Exception e) {
                    secret.setSecretValue("DECRYPTION_ERROR");
                    return secret;
                }
            }).collect(Collectors.toList());
    }
    // GET: Get all secrets for a specific environment
    // URL: /api/secrets/env/your-uuid-here
    @GetMapping("/env/{envId}")
public List<Secret> getSecretsByEnvironment(@PathVariable UUID envId) {
    List<Secret> secrets = secretRepository.findByEnvironmentId(envId);
    
    // Safety check: Return empty list instead of crashing if null or empty
    if (secrets == null || secrets.isEmpty()) {
        return new java.util.ArrayList<>();
    }

    return secrets.stream().map(secret -> {
        try {
            // Only decrypt if the value exists and isn't empty
            if (secret.getSecretValue() != null && !secret.getSecretValue().trim().isEmpty()) {
                String decrypted = encryptionService.decrypt(secret.getSecretValue());
                secret.setSecretValue(decrypted);
            }
            return secret;
        } catch (Exception e) {
            // Keep the app running even if decryption fails for one item
            secret.setSecretValue("DECRYPTION_ERROR");
            return secret;
        }
    }).collect(Collectors.toList());
}
@PutMapping("/{id}")
public Secret updateSecret(@PathVariable UUID id, @RequestBody Secret secretDetails) {
    return secretRepository.findById(id)
        .map(existingSecret -> {
            try {
                // 1. Only update the value if it was provided in the body
                if (secretDetails.getSecretValue() != null) {
                    String encryptedValue = encryptionService.encrypt(secretDetails.getSecretValue());
                    existingSecret.setSecretValue(encryptedValue);
                }
                
                // 2. Only update the key name if provided
                if (secretDetails.getSecretKey() != null) {
                    existingSecret.setSecretKey(secretDetails.getSecretKey());
                }

                // 3. Save only the existing (already attached) object
                return secretRepository.save(existingSecret);
            } catch (Exception e) {
                throw new RuntimeException("Encryption failed: " + e.getMessage());
            }
        })
        .orElseThrow(() -> new RuntimeException("Secret not found with id: " + id));
}

}