package com.example.backend.repository;

import com.example.backend.entity.Secret;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SecretRepository extends JpaRepository<Secret, UUID> {
    List<Secret> findByEnvironmentId(UUID environmentId);
}