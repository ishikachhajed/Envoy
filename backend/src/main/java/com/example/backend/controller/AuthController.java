package com.example.backend.controller;
import com.example.backend.dto.*;
import com.example.backend.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
/**
 * AuthController — What this file does:
 * ──────────────────────────────────────
 * This is the HTTP API entry point for all authentication operations.
 * It defines the URL routes that the frontend calls, validates that a
 * request body exists, delegates the actual work to AuthService, and
 * returns the appropriate HTTP response.
 *
 * Why separate Controller from Service?
 * The Controller handles HTTP concerns (routes, status codes, request/response).
 * The Service handles business logic (OTP generation, user creation, JWT issuance).
 * Separating them makes each class smaller, easier to test, and easier to maintain.
 * This is the "Separation of Concerns" principle used in all enterprise applications.
 * Security: All these endpoints are public (no JWT required).
 *   They are whitelisted in SecurityConfig.java under /api/auth/**
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;
    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // POST /api/auth/signup 
    @PostMapping("/request-otp")
    public ResponseEntity<Map<String, String>> requestOtp(@RequestBody OtpRequestDTO request) {
        authService.requestOtp(request);
        return ResponseEntity.ok(Map.of(
            "message", "Verification code sent to " + request.getEmail()
        ));
    }
    
     //POST /api/auth/verify-otp
    @PostMapping("/verify-otp")
    public ResponseEntity<AuthResponseDTO> verifyOtp(@RequestBody OtpVerifyDTO request) {
        AuthResponseDTO response = authService.verifyOtp(request);
        return ResponseEntity.ok(response);
    }

    /** POST /api/auth/signup — Password-based registration (legacy) */
    @PostMapping("/signup")
    public ResponseEntity<AuthResponseDTO> signup(@RequestBody SignupRequestDTO request) {
        AuthResponseDTO response = authService.signup(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    /** POST /api/auth/login — Password-based login (legacy) */
    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@RequestBody LoginRequestDTO request) {
        AuthResponseDTO response = authService.login(request);
        return ResponseEntity.ok(response);
    }
}
