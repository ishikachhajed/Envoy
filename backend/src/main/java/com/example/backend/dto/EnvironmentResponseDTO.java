package com.example.backend.dto;

import java.util.UUID;

/**
 * EnvironmentResponseDTO: Sanitized, flat container for environments.
 * Prevents heavy domain parent object serialization.
 */
public class EnvironmentResponseDTO {

    private UUID id;
    private String name;

    public EnvironmentResponseDTO(UUID id, String name) {
        this.id = id;
        this.name = name;
    }

    // Getters required for JSON mapping

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }
}
