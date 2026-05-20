package com.example.backend.repository;

import com.example.backend.entity.SecretChangeRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * SecretChangeRequestRepository: Handles JPA operations for the secret_change_requests table.
 */
@Repository
public interface SecretChangeRequestRepository extends JpaRepository<SecretChangeRequest, UUID> {
    List<SecretChangeRequest> findByEnvironmentIdOrderByCreatedAtDesc(UUID environmentId);
}
