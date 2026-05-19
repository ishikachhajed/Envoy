package com.example.backend.controller;

import com.example.backend.dto.EnvironmentResponseDTO;
import com.example.backend.service.ProjectService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * EnvironmentController: Nest environment access routes under their parent projects.
 * Enforces strict multi-tenant boundary checks via ProjectService.
 */
@RestController
@RequestMapping("/api/projects/{projectId}/environments")
public class EnvironmentController {

    private final ProjectService projectService;

    public EnvironmentController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping
    public ResponseEntity<List<EnvironmentResponseDTO>> getEnvironmentsByProject(
            @PathVariable UUID projectId) {
        List<EnvironmentResponseDTO> response = projectService.getEnvironmentsByProject(projectId);
        return ResponseEntity.ok(response);
    }
}