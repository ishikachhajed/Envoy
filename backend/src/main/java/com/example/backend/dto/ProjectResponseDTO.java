package com.example.backend.dto;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * ProjectResponseDTO: Curated, safe, and flat view of a Project.
 * Returns core project properties without parent relationship lists.
 */
public class ProjectResponseDTO {

    private UUID id;
    private String name;
    private String description;
    private LocalDateTime createdAt;

    public ProjectResponseDTO(UUID id, String name, String description, LocalDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.createdAt = createdAt;
    }

    // Getters required for JSON serialization

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
