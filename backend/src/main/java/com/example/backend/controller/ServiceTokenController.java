package com.example.backend.controller;

import com.example.backend.service.ServiceTokenService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping
public class ServiceTokenController {

    private final ServiceTokenService serviceTokenService;

    public ServiceTokenController(ServiceTokenService serviceTokenService) {
        this.serviceTokenService = serviceTokenService;
    }

    @PostMapping("/api/environments/{envId}/tokens")
    public ResponseEntity<Map<String, Object>> generateToken(
            @PathVariable UUID envId,
            @RequestBody Map<String, String> body) {

        String tokenName = body.getOrDefault("name", "Unnamed Token");
        Map<String, Object> result = serviceTokenService.generateToken(envId, tokenName);
        return ResponseEntity.ok(result);
    }
}
