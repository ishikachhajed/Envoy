package com.example.backend.controller;

import com.example.backend.dto.CreateSecretRequestDTO;
import com.example.backend.dto.SecretChangeRequestResponseDTO;
import com.example.backend.service.SecretChangeRequestService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;


 // SecretChangeRequestController: REST boundary exposing the Change Approval workflow.
@RestController
public class SecretChangeRequestController {

    private final SecretChangeRequestService changeRequestService;

    public SecretChangeRequestController(SecretChangeRequestService changeRequestService) {
        this.changeRequestService = changeRequestService;
    }

    /**
     * Submits a new secret change request for an environment.
     * Endpoint: POST /api/environments/{envId}/change-requests
     */
    @PostMapping("/api/environments/{envId}/change-requests")
    public ResponseEntity<SecretChangeRequestResponseDTO> createChangeRequest(
            @PathVariable UUID envId,
            @RequestBody CreateSecretRequestDTO dto) {
        SecretChangeRequestResponseDTO response = changeRequestService.createChangeRequest(envId, dto);
        return ResponseEntity.ok(response);
    }

    /**
     * Lists all secret change requests for a given environment.
     * Endpoint: GET /api/environments/{envId}/change-requests
     */
    @GetMapping("/api/environments/{envId}/change-requests")
    public ResponseEntity<List<SecretChangeRequestResponseDTO>> listChangeRequests(
            @PathVariable UUID envId) {
        List<SecretChangeRequestResponseDTO> response = changeRequestService.listChangeRequests(envId);
        return ResponseEntity.ok(response);
    }

    /**
     * Resolves (approves or rejects) a pending change request.
     * Endpoint: POST /api/change-requests/{requestId}/resolve?action=APPROVE
     */
    @PostMapping("/api/change-requests/{requestId}/resolve")
    public ResponseEntity<SecretChangeRequestResponseDTO> resolveRequest(
            @PathVariable UUID requestId,
            @RequestParam String action) {
        SecretChangeRequestResponseDTO response = changeRequestService.resolveRequest(requestId, action);
        return ResponseEntity.ok(response);
    }
}
