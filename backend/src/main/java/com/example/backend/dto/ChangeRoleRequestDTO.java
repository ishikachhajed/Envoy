package com.example.backend.dto;
import com.example.backend.enums.Role;
public class ChangeRoleRequestDTO {
    private Role role;
    public ChangeRoleRequestDTO() {}
    public ChangeRoleRequestDTO(Role role) {
        this.role = role;
    }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
}