package com.example.backend.dto;

import com.example.backend.enums.Role;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * MemberResponseDTO: Combines User details with their Role in the organization.
 * This provides a clean, flat object for the frontend to display in member lists.
 */
public class MemberResponseDTO {

    private UUID membershipId;
    private String userName;
    private String userEmail;
    private Role role;
    private LocalDateTime joinedAt;

    public MemberResponseDTO(UUID membershipId, String userName, String userEmail, Role role, LocalDateTime joinedAt) {
        this.membershipId = membershipId;
        this.userName = userName;
        this.userEmail = userEmail;
        this.role = role;
        this.joinedAt = joinedAt;
    }

    // Getters for JSON serialization
    
    public UUID getMembershipId() { return membershipId; }
    public String getUserName() { return userName; }
    public String getUserEmail() { return userEmail; }
    public Role getRole() { return role; }
    public LocalDateTime getJoinedAt() { return joinedAt; }
}
