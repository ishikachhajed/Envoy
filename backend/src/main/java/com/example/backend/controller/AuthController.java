package com.example.backend.controller;

import com.example.backend.entity.User;
import com.example.backend.repository.UserRepository;
import com.example.backend.security.AuthRequest;
import com.example.backend.security.JwtUtils;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtils jwtUtils) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
    }

    @PostMapping("/login")
    public String login(@RequestBody AuthRequest authRequest) {
        // 1. Find the user by email
        User user = userRepository.findByEmail(authRequest.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found!"));

        // 2. Check if the password matches the hash in the DB
        if (passwordEncoder.matches(authRequest.getPassword(), user.getPasswordHash())) {
            // 3. If correct, generate and return the token
            return jwtUtils.generateToken(user.getEmail());
        } else {
            throw new RuntimeException("Invalid credentials!");
        }
    }
}