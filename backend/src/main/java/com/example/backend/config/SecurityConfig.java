package com.example.backend.config;

import com.example.backend.security.JwtFilter;
import com.example.backend.security.JwtUtils;
import com.example.backend.security.ServiceTokenFilter;
import com.example.backend.repository.EnvironmentRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtUtils jwtUtils;
    private final EnvironmentRepository environmentRepository;

    public SecurityConfig(JwtUtils jwtUtils, EnvironmentRepository environmentRepository) {
        this.jwtUtils = jwtUtils;
        this.environmentRepository = environmentRepository;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // 1. Enable CORS and Disable CSRF
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(AbstractHttpConfigurer::disable)

            .formLogin(AbstractHttpConfigurer::disable)
            .httpBasic(AbstractHttpConfigurer::disable)

            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            .authorizeHttpRequests(auth -> auth
                // /api/auth/signup and /api/auth/login are public — no token needed
                .requestMatchers("/api/auth/**").permitAll()
                // Every other endpoint requires a valid JWT or Service Token
                .anyRequest().authenticated()
            )

            // ServiceTokenFilter runs FIRST: checks for "Bearer envoy_..." tokens
            // If it finds one, it authenticates the request and JwtFilter skips it.
            // If not, it passes through to JwtFilter for normal JWT authentication.
            .addFilterBefore(new ServiceTokenFilter(environmentRepository), UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(new JwtFilter(jwtUtils), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }


    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Allows Next.js (3000) and Vercel deployed frontend to talk to Spring (8080)
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000", "https://envoy-vault-frontend.vercel.app")); 
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type"));
        configuration.setAllowCredentials(true); // Important for cookies/auth headers
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}