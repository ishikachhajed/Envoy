package com.example.backend.dto;

import java.time.ZonedDateTime;
import java.util.UUID;

/**
 * SecretResponseDTO: Flat, sanitized view of a decrypted or masked Secret record.
 * Hides JPA parent hierarchy details.
 */
public class SecretResponseDTO {

    private UUID id;
    private String key;
    private String value;
    private ZonedDateTime createdAt;
    private ZonedDateTime updatedAt;

    public SecretResponseDTO(UUID id, String key, String value, ZonedDateTime createdAt, ZonedDateTime updatedAt) {
        this.id = id;
        this.key = key;
        this.value = value;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Getters required for JSON mapping

    public UUID getId() {
        return id;
    }

    public String getKey() {
        return key;
    }

    public String getValue() {
        return value;
    }

    public ZonedDateTime getCreatedAt() {
        return createdAt;
    }

    public ZonedDateTime getUpdatedAt() {
        return updatedAt;
    }
}
