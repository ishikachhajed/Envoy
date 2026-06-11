package com.example.backend.controller;

import com.example.backend.dto.CreateSecretRequestDTO;
import com.example.backend.dto.SecretResponseDTO;
import com.example.backend.service.SecretService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * SecretController: Exposes secure nested rest boundaries for secrets management.
 * Relies exclusively on SecretService for tenant boundary checks and AES-GCM-256 ciphers.
 */
@RestController
@RequestMapping
public class SecretController {

    private final SecretService secretService;

    public SecretController(SecretService secretService) {
        this.secretService = secretService;
    }

    /**
     * Creates and encrypts a secret inside a specific environment.
     * Endpoint: POST /api/environments/{envId}/secrets
     */
    @PostMapping("/api/environments/{envId}/secrets")
    public ResponseEntity<SecretResponseDTO> createSecret(
            @PathVariable UUID envId,
            @RequestBody CreateSecretRequestDTO dto) {
        SecretResponseDTO response = secretService.createSecret(envId, dto);
        return ResponseEntity.ok(response);
    }

    /**
     * Lists and decrypts all secrets within an environment on the fly.
     * Endpoint: GET /api/environments/{envId}/secrets
     */
    @GetMapping("/api/environments/{envId}/secrets")
    public ResponseEntity<List<SecretResponseDTO>> getSecretsByEnvironment(
            @PathVariable UUID envId) {
        List<SecretResponseDTO> response = secretService.getSecretsByEnvironment(envId);
        return ResponseEntity.ok(response);
    }

    /**
     * Decrypts and reveals a single secret value on-demand.
     * Endpoint: GET /api/secrets/{secretId}/reveal
     */
    @GetMapping("/api/secrets/{secretId}/reveal")
    public ResponseEntity<SecretResponseDTO> revealSecret(@PathVariable UUID secretId) {
        SecretResponseDTO response = secretService.revealSecret(secretId);
        return ResponseEntity.ok(response);
    }

    /**
     * Deletes a secret from the database.
     * Endpoint: DELETE /api/secrets/{secretId}
     */
    @DeleteMapping("/api/secrets/{secretId}")
    public ResponseEntity<Void> deleteSecret(@PathVariable UUID secretId) {
        secretService.deleteSecret(secretId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Automated Server Endpoint for fetching secrets using a Service Token.
     * The Environment ID is securely derived from the ServiceTokenFilter identity.
     * Endpoint: GET /api/service-token/secrets
     */
    @GetMapping("/api/service-token/secrets")
    public ResponseEntity<List<SecretResponseDTO>> getSecretsForServiceToken() {
        org.springframework.security.core.Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        
        // Extract the environment ID embedded by the ServiceTokenFilter
        String allowedEnvId = auth.getName().split(":")[1];
        
        List<SecretResponseDTO> response = secretService.getSecretsByEnvironment(UUID.fromString(allowedEnvId));
        return ResponseEntity.ok(response);
    }
}