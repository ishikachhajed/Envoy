package com.example.backend.controller;
import com.example.backend.dto.*;
import com.example.backend.service.OrganizationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;
/**
 * OrganizationController: The API entry point for all team and multi-tenant
 * operations.
 */
@RestController
@RequestMapping("/api/organizations")
public class OrganizationController {
    private final OrganizationService organizationService;
    public OrganizationController(OrganizationService organizationService) {
        this.organizationService = organizationService;
    }
    /**
     * POST /api/organizations
     * Creates a new organization and makes the current user an ADMIN.
     */
    @PostMapping
    public ResponseEntity<OrgResponseDTO> create(@RequestBody CreateOrgRequestDTO request) {
        OrgResponseDTO response = organizationService.createOrganization(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    /**
     * GET /api/organizations/mine
     * Returns a list of all organizations the current authenticated user belongs
     * to.
     */
    @GetMapping("/mine")
    public ResponseEntity<List<OrgResponseDTO>> getMyOrganizations() {
        List<OrgResponseDTO> response = organizationService.getOrganizationsForUser();
        return ResponseEntity.ok(response);
    }
    /**
     * POST /api/organizations/{id}/members
     * Adds a new member to an organization. Only accessible by organization ADMINs.
     */
    @PostMapping("/{id}/members")
    public ResponseEntity<String> addMember(@PathVariable UUID id, @RequestBody AddMemberRequestDTO request) {
        organizationService.addMember(id, request);
        return ResponseEntity.ok("Member added successfully.");
    }
    /**
     * GET /api/organizations/{id}/members
     * Returns a list of all members and their roles for a specific organization.
     */
    @GetMapping("/{id}/members")
    public ResponseEntity<List<MemberResponseDTO>> getMembers(@PathVariable UUID id) {
        List<MemberResponseDTO> response = organizationService.getOrganizationMembers(id);
        return ResponseEntity.ok(response);
    }
    /**
     * PATCH /api/organizations/{id}/members/{userId}/role
     * Changes the role of a member in the organization.
     */
    @PatchMapping("/{id}/members/{userId}/role")
    public ResponseEntity<String> changeMemberRole(
            @PathVariable UUID id, 
            @PathVariable UUID userId, 
            @RequestBody ChangeRoleRequestDTO request) {
        organizationService.changeMemberRole(id, userId, request.getRole());
        return ResponseEntity.ok("Member role updated successfully.");
    }
    /**
     * DELETE /api/organizations/{id}/members/{userId}
     * Removes a member from the organization.
     */
    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<String> removeMember(
            @PathVariable UUID id, 
            @PathVariable UUID userId) {
        organizationService.removeMember(id, userId);
        return ResponseEntity.ok("Member removed successfully.");
    }
    /**
     * GET /api/organizations/{id}/invitations
     * Returns a list of pending invitations for a specific organization.
     */
    @GetMapping("/{id}/invitations")
    public ResponseEntity<List<InvitationResponseDTO>> getPendingInvitations(@PathVariable UUID id) {
        List<InvitationResponseDTO> response = organizationService.getPendingInvitations(id);
        return ResponseEntity.ok(response);
    }
    /**
     * POST /api/organizations/invitations/accept?token={token}
     * Accepts a pending invitation and joins the organization.
     */
    @PostMapping("/invitations/accept")
    public ResponseEntity<String> acceptInvitation(@RequestParam String token) {
        organizationService.acceptInvitation(token);
        return ResponseEntity.ok("Invitation accepted successfully.");
    }
}