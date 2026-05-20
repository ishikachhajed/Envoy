package com.example.backend.repository;

import com.example.backend.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * AuditLogRepository: Handles multi-tenant queries for immutable audit logs in PostgreSQL.
 */
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
    List<AuditLog> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);
}
