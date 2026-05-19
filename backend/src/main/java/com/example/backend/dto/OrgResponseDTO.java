package com.example.backend.dto;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * OrgResponseDTO: A sanitized version of the Organization entity.
 * This is what the frontend sees. It contains NO relationship lists 
 * to prevent circular references and data leaks.
 */
public class OrgResponseDTO {

    private UUID id;
    private String name;
    private String slug;
    private LocalDateTime createdAt;

    public OrgResponseDTO(UUID id, String name, String slug, LocalDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.slug = slug;
        this.createdAt = createdAt;
    }

    // Getters are required for Jackson to transform this object into JSON
    
    public UUID getId() { return id; }
    public String getName() { return name; }
    public String getSlug() { return slug; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
