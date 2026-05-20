package com.example.backend.dto;

import com.example.backend.enums.RequestStatus;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * SecretChangeRequestResponseDTO: A flat, safe data representation of 
 * a SecretChangeRequest for API payloads.
 */
public class SecretChangeRequestResponseDTO {
    private UUID id;
    private String secretKey;
    private String maskedValue;
    private String requesterEmail;
    private RequestStatus status;
    private String resolverEmail;
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;

    public SecretChangeRequestResponseDTO(UUID id, String secretKey, String maskedValue,
                                         String requesterEmail, RequestStatus status,
                                         String resolverEmail, LocalDateTime createdAt,
                                         LocalDateTime resolvedAt) {
        this.id = id;
        this.secretKey = secretKey;
        this.maskedValue = maskedValue;
        this.requesterEmail = requesterEmail;
        this.status = status;
        this.resolverEmail = resolverEmail;
        this.createdAt = createdAt;
        this.resolvedAt = resolvedAt;
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getSecretKey() {
        return secretKey;
    }

    public void setSecretKey(String secretKey) {
        this.secretKey = secretKey;
    }

    public String getMaskedValue() {
        return maskedValue;
    }

    public void setMaskedValue(String maskedValue) {
        this.maskedValue = maskedValue;
    }

    public String getRequesterEmail() {
        return requesterEmail;
    }

    public void setRequesterEmail(String requesterEmail) {
        this.requesterEmail = requesterEmail;
    }

    public RequestStatus getStatus() {
        return status;
    }

    public void setStatus(RequestStatus status) {
        this.status = status;
    }

    public String getResolverEmail() {
        return resolverEmail;
    }

    public void setResolverEmail(String resolverEmail) {
        this.resolverEmail = resolverEmail;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getResolvedAt() {
        return resolvedAt;
    }

    public void setResolvedAt(LocalDateTime resolvedAt) {
        this.resolvedAt = resolvedAt;
    }
}
