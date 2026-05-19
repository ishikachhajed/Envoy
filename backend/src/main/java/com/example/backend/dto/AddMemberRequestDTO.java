package com.example.backend.dto;

import com.example.backend.enums.Role;

/**
 * AddMemberRequestDTO: Data required to add a new member to a team.
 * 
 * We use the user's email to find them in our system.
 * We use the Role enum to ensure only valid roles (ADMIN, MEMBER) are assigned.
 */
public class AddMemberRequestDTO {

    private String email;
    private Role role;

    public AddMemberRequestDTO() {}

    public AddMemberRequestDTO(String email, Role role) {
        this.email = email;
        this.role = role;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }
}
