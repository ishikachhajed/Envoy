package com.example.backend.dto;
import com.example.backend.enums.Role;
import java.time.LocalDateTime;
import java.util.UUID;
public class MemberResponseDTO {

    private UUID membershipId;
    private UUID userId;
    private String userName;
    private String userEmail;
    private Role role;
    private LocalDateTime joinedAt;

    public MemberResponseDTO(
            UUID membershipId,
            UUID userId,
            String userName,
            String userEmail,
            Role role,
            LocalDateTime joinedAt) {

        this.membershipId = membershipId;
        this.userId = userId;
        this.userName = userName;
        this.userEmail = userEmail;
        this.role = role;
        this.joinedAt = joinedAt;
    }

    public UUID getMembershipId() { return membershipId; }
    public UUID getUserId() { return userId; }
    public String getUserName() { return userName; }
    public String getUserEmail() { return userEmail; }
    public Role getRole() { return role; }
    public LocalDateTime getJoinedAt() { return joinedAt; }
}