package com.example.backend.repository;

import com.example.backend.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID> {
    // SELECT * FROM projects WHERE organization_id = ?
    List<Project> findByOrganizationId(UUID organizationId);
}