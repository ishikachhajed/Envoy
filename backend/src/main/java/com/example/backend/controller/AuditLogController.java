package com.example.backend.controller;

import com.example.backend.entity.AuditLog;
import com.example.backend.service.AuditLogService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * AuditLogController: REST API boundary exposing organization-wide audit logs.
 */
@RestController
@RequestMapping("/api/organizations/{orgId}/audit-logs")
public class AuditLogController {

    private final AuditLogService auditLogService;

    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    /**
     * Retrieves the audit logs for an organization.
     * Endpoint: GET /api/organizations/{orgId}/audit-logs
     */
    @GetMapping
    public ResponseEntity<List<AuditLog>> getAuditLogs(@PathVariable UUID orgId) {
        List<AuditLog> logs = auditLogService.getAuditLogs(orgId);
        return ResponseEntity.ok(logs);
    }
}
