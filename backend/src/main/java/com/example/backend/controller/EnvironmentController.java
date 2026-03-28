package com.example.backend.controller;

import com.example.backend.entity.Environment;
import com.example.backend.repository.EnvironmentRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/environments") // This is the exact URL Postman is looking for!
public class EnvironmentController {

    private final EnvironmentRepository environmentRepository;

    public EnvironmentController(EnvironmentRepository environmentRepository) {
        this.environmentRepository = environmentRepository;
    }

    @PostMapping
    public Environment createEnvironment(@RequestBody Environment newEnvironment) {
        return environmentRepository.save(newEnvironment);
    }

    @GetMapping
    public List<Environment> getAllEnvironments() {
        return environmentRepository.findAll();
    }
}