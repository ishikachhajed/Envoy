package com.example.backend.dto;
import com.example.backend.enums.Role;
import java.time.LocalDateTime;
import java.util.UUID;
public class InvitationResponseDTO {
    private UUID id;
    private String email;
    private Role role;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
    public InvitationResponseDTO(UUID id, String email, Role role, LocalDateTime expiresAt, LocalDateTime createdAt) {
        this.id = id;
        this.email = email;
        this.role = role;
        this.expiresAt = expiresAt;
        this.createdAt = createdAt;
    }
    public UUID getId() { return id; }
    public String getEmail() { return email; }
    public Role getRole() { return role; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}