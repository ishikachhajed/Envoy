package com.example.backend.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public class UserResponseDTO {
    private UUID id;
    private String name;
    private String email;
    private LocalDateTime createdAt;

    public UserResponseDTO(UUID id, String name, String email, LocalDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.createdAt = createdAt;
    }

    public UUID getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
