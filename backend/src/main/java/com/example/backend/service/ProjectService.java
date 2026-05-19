package com.example.backend.service;

import com.example.backend.dto.CreateProjectRequestDTO;
import com.example.backend.dto.ProjectResponseDTO;
import com.example.backend.dto.EnvironmentResponseDTO;
import com.example.backend.entity.Environment;
import com.example.backend.entity.Organization;
import com.example.backend.entity.Project;
import com.example.backend.entity.User;
import com.example.backend.repository.EnvironmentRepository;
import com.example.backend.repository.MembershipRepository;
import com.example.backend.repository.OrganizationRepository;
import com.example.backend.repository.ProjectRepository;
import com.example.backend.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * ProjectService: Implements business actions for projects and standard environments.
 * Enforces organization-based multi-tenant boundary checks.
 */
@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final EnvironmentRepository environmentRepository;
    private final OrganizationRepository organizationRepository;
    private final MembershipRepository membershipRepository;
    private final UserRepository userRepository;

    public ProjectService(ProjectRepository projectRepository,
                          EnvironmentRepository environmentRepository,
                          OrganizationRepository organizationRepository,
                          MembershipRepository membershipRepository,
                          UserRepository userRepository) {
        this.projectRepository = projectRepository;
        this.environmentRepository = environmentRepository;
        this.organizationRepository = organizationRepository;
        this.membershipRepository = membershipRepository;
        this.userRepository = userRepository;
    }

    /**
     * Helper: Identifies current user from security authentication credentials.
     */
    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found."));
    }

    /**
     * Helper: Verifies user membership in target organization. Throws AccessDenied.
     */
    private void validateOrganizationMembership(UUID orgId, UUID userId) {
        membershipRepository.findByUserIdAndOrganizationId(userId, orgId)
                .orElseThrow(() -> new RuntimeException("Access Denied: You do not belong to this organization."));
    }

    /**
     * Creates a project and auto-provisions Development, Staging, and Production.
     */
    @Transactional
    public ProjectResponseDTO createProject(UUID orgId, CreateProjectRequestDTO request) {
        User currentUser = getCurrentUser();
        validateOrganizationMembership(orgId, currentUser.getId());

        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new RuntimeException("Organization not found."));

        // 1. Save Project
        Project project = new Project();
        project.setName(request.getName());
        project.setDescription(request.getDescription());
        project.setOrganization(org);
        Project savedProject = projectRepository.save(project);

        // 2. Auto-provision standard environments
        String[] defaultEnvironments = {"Development", "Staging", "Production"};
        for (String envName : defaultEnvironments) {
            Environment env = new Environment();
            env.setName(envName);
            env.setProject(savedProject);
            environmentRepository.save(env);
        }

        return new ProjectResponseDTO(
                savedProject.getId(),
                savedProject.getName(),
                savedProject.getDescription(),
                savedProject.getCreatedAt()
        );
    }

    /**
     * Get all projects in the organization.
     */
    @Transactional(readOnly = true)
    public List<ProjectResponseDTO> getProjectsByOrganization(UUID orgId) {
        User currentUser = getCurrentUser();
        validateOrganizationMembership(orgId, currentUser.getId());

        List<Project> projects = projectRepository.findByOrganizationId(orgId);

        return projects.stream()
                .map(p -> new ProjectResponseDTO(
                        p.getId(),
                        p.getName(),
                        p.getDescription(),
                        p.getCreatedAt()
                ))
                .collect(Collectors.toList());
    }

    /**
     * Lists all environments for a specific project.
     * Enforces organization membership boundary check.
     */
    @Transactional(readOnly = true)
    public List<EnvironmentResponseDTO> getEnvironmentsByProject(UUID projectId) {
        User currentUser = getCurrentUser();
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found."));

        // Enforce membership check at the Organization level
        validateOrganizationMembership(project.getOrganization().getId(), currentUser.getId());

        List<Environment> environments = environmentRepository.findByProjectId(projectId);

        return environments.stream()
                .map(env -> new EnvironmentResponseDTO(
                        env.getId(),
                        env.getName()
                ))
                .collect(Collectors.toList());
    }
}
