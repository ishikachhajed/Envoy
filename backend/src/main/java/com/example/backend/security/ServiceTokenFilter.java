package com.example.backend.security;

import com.example.backend.entity.Environment;
import com.example.backend.repository.EnvironmentRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

public class ServiceTokenFilter extends OncePerRequestFilter {

    private final EnvironmentRepository environmentRepository;

    public ServiceTokenFilter(EnvironmentRepository environmentRepository) {
        this.environmentRepository = environmentRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer envoy_")) {

            String rawToken = authHeader.substring(7);

            Optional<Environment> validEnvironment = environmentRepository.findByServiceToken(rawToken);

            if (validEnvironment.isPresent()) {
                Environment environment = validEnvironment.get();
                String identity = "service-token:" + environment.getId();

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                identity,
                                null,
                                List.of(new SimpleGrantedAuthority("ROLE_SERVICE_TOKEN"))
                        );
                SecurityContextHolder.getContext().setAuthentication(authentication);

            } else {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\": \"Invalid service token.\"}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}
