package com.example.backend.controller;

import com.example.backend.entity.Project;
import com.example.backend.repository.ProjectRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects") // This sets the URL for Postman!
public class ProjectController {

    private final ProjectRepository projectRepository;

    public ProjectController(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    // POST: Create a new project
    @PostMapping
    public Project createProject(@RequestBody Project newProject) {
        // Saves the new project into PostgreSQL
        return projectRepository.save(newProject);
    }

    // GET: Get all projects
    @GetMapping
    public List<Project> getAllProjects() {
        return projectRepository.findAll();
    }
}