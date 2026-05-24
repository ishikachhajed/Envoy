package com.example.backend.controller;

import com.example.backend.dto.EnvironmentResponseDTO;
import com.example.backend.entity.Project;
import com.example.backend.repository.ProjectRepository;
import com.example.backend.service.ProjectService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping("/{id}/environments")
    public ResponseEntity<List<EnvironmentResponseDTO>> getEnvironments(@PathVariable UUID id) {
        List<EnvironmentResponseDTO> response = projectService.getEnvironmentsByProject(id);
        return ResponseEntity.ok(response);
    }
}