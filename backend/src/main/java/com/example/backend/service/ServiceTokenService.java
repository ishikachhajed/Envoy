package com.example.backend.service;

import com.example.backend.entity.Environment;
import com.example.backend.entity.Membership;
import com.example.backend.entity.User;
import com.example.backend.enums.Role;
import com.example.backend.exception.CustomAccessDeniedException;
import com.example.backend.repository.EnvironmentRepository;
import com.example.backend.repository.MembershipRepository;
import com.example.backend.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.*;

@Service
public class ServiceTokenService {

    private final EnvironmentRepository environmentRepository;
    private final MembershipRepository membershipRepository;
    private final UserRepository userRepository;

    private static final SecureRandom secureRandom = new SecureRandom();
    private static final String CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    public ServiceTokenService(EnvironmentRepository environmentRepository,
                               MembershipRepository membershipRepository,
                               UserRepository userRepository) {
        this.environmentRepository = environmentRepository;
        this.membershipRepository = membershipRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public Map<String, Object> generateToken(UUID environmentId, String tokenName) {
        User currentUser = getCurrentUser();

        Environment environment = environmentRepository.findById(environmentId)
                .orElseThrow(() -> new RuntimeException("Environment not found."));

        UUID orgId = environment.getProject().getOrganization().getId();
        Membership membership = membershipRepository.findByUserIdAndOrganizationId(currentUser.getId(), orgId)
                .orElseThrow(() -> new CustomAccessDeniedException("Access Denied: You are not a member of this organization."));

        if (membership.getRole() != Role.ADMIN) {
            throw new CustomAccessDeniedException("Access Denied: Only Admins can generate service tokens.");
        }

        // Generate a new simple token
        String rawToken = generateSecureToken();
        
        // Save the token directly in the Environment (No hashing, No limits)
        environment.setServiceToken(rawToken);
        environmentRepository.save(environment);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("token", rawToken);
        response.put("environmentId", environment.getId());
        response.put("message", "Token generated successfully.");

        return response;
    }

    private String generateSecureToken() {
        StringBuilder sb = new StringBuilder("envoy_");
        for (int i = 0; i < 48; i++) {
            int index = secureRandom.nextInt(CHARACTERS.length());
            sb.append(CHARACTERS.charAt(index));
        }
        return sb.toString();
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Logged in user not found."));
    }
}
