package com.example.backend.controller;
import com.example.backend.dto.*;
import com.example.backend.service.OrganizationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;
@RestController
@RequestMapping("/api/organizations")
public class OrganizationController {
    private final OrganizationService organizationService;
    private final com.example.backend.service.ProjectService projectService;

    public OrganizationController(OrganizationService organizationService, com.example.backend.service.ProjectService projectService) {
        this.organizationService = organizationService;
        this.projectService = projectService;
    }
    @PostMapping
    public ResponseEntity<OrgResponseDTO> create(@RequestBody CreateOrgRequestDTO request) {
        OrgResponseDTO response = organizationService.createOrganization(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    @GetMapping("/mine")
    public ResponseEntity<List<OrgResponseDTO>> getMyOrganizations() {
        List<OrgResponseDTO> response = organizationService.getOrganizationsForUser();
        return ResponseEntity.ok(response);
    }
    @PostMapping("/{id}/members")
    public ResponseEntity<String> addMember(@PathVariable UUID id, @RequestBody AddMemberRequestDTO request) {
        organizationService.addMember(id, request);
        return ResponseEntity.ok("Member added successfully.");
    }
    @GetMapping("/{id}/members")
    public ResponseEntity<List<MemberResponseDTO>> getMembers(@PathVariable UUID id) {
        List<MemberResponseDTO> response = organizationService.getOrganizationMembers(id);
        return ResponseEntity.ok(response);
    }
    @PatchMapping("/{id}/members/{userId}/role")
    public ResponseEntity<String> changeMemberRole(
            @PathVariable UUID id, 
            @PathVariable UUID userId, 
            @RequestBody ChangeRoleRequestDTO request) {
        organizationService.changeMemberRole(id, userId, request.getRole());
        return ResponseEntity.ok("Member role updated successfully.");
    }
    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<String> removeMember(
            @PathVariable UUID id, 
            @PathVariable UUID userId) {
        organizationService.removeMember(id, userId);
        return ResponseEntity.ok("Member removed successfully.");
    }
    @GetMapping("/{id}/invitations")
    public ResponseEntity<List<InvitationResponseDTO>> getPendingInvitations(@PathVariable UUID id) {
        List<InvitationResponseDTO> response = organizationService.getPendingInvitations(id);
        return ResponseEntity.ok(response);
    }
    @PostMapping("/invitations/accept")
    public ResponseEntity<String> acceptInvitation(@RequestParam String token) {
        organizationService.acceptInvitation(token);
        return ResponseEntity.ok("Invitation accepted successfully.");
    }
    @GetMapping("/{id}/projects")
    public ResponseEntity<List<ProjectResponseDTO>> getProjects(@PathVariable UUID id) {
        List<ProjectResponseDTO> response = projectService.getProjectsByOrganization(id);
        return ResponseEntity.ok(response);
    }
    @PostMapping("/{id}/projects")
    public ResponseEntity<ProjectResponseDTO> createProject(@PathVariable UUID id, @RequestBody CreateProjectRequestDTO request) {
        ProjectResponseDTO response = projectService.createProject(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}