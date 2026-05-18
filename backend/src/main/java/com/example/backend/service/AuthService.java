package com.example.backend.service;

import com.example.backend.dto.AuthResponseDTO;
import com.example.backend.dto.LoginRequestDTO;
import com.example.backend.dto.SignupRequestDTO;
import com.example.backend.dto.UserResponseDTO;
import com.example.backend.entity.User;
import com.example.backend.repository.UserRepository;
import com.example.backend.security.JwtUtils;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtils jwtUtils) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
    }

    // ── SIGNUP ──────────────────────────────────────────────────────────
    public AuthResponseDTO signup(SignupRequestDTO request) {

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("A user with this email already exists.");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());

        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));

        User saved = userRepository.save(user);

        // 5. Issue a JWT and return a safe response (no passwordHash)
        String token = jwtUtils.generateToken(saved.getEmail());
        UserResponseDTO userDTO = new UserResponseDTO(
                saved.getId(), saved.getName(), saved.getEmail(), saved.getCreatedAt());

        return new AuthResponseDTO(token, userDTO);
    }

    // ── LOGIN ───────────────────────────────────────────────────────────
    public AuthResponseDTO login(LoginRequestDTO request) {

        // 1. Look up the user — same error message for "not found" AND "wrong password"
        //    to prevent email-enumeration attacks (attackers can't probe which emails exist)
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid credentials."));
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid credentials.");
        }

        String token = jwtUtils.generateToken(user.getEmail());
        UserResponseDTO userDTO = new UserResponseDTO(
                user.getId(), user.getName(), user.getEmail(), user.getCreatedAt());

        return new AuthResponseDTO(token, userDTO);
    }
}
