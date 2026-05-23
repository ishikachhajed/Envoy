package com.example.backend.service;

import com.example.backend.dto.*;
import com.example.backend.entity.User;
import com.example.backend.repository.UserRepository;
import com.example.backend.security.JwtUtils;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.UUID;

/**
 * AuthService — What this file does:
 * ─────────────────────────────────────
 * This is the brain of all authentication operations.
 * It orchestrates the full OTP authentication flow:
 *   1. requestOtp  → validates email format, triggers OTP generation + email delivery
 *   2. verifyOtp   → validates the submitted code, auto-creates user if new, issues JWT
 *
 * Legacy password-based flows (signup/login) are kept for backward compatibility.
 *
 * Why is it needed?
 * The Controller should not contain business logic — it just routes HTTP requests.
 * The OtpService handles OTP mechanics.
 * The AuthService is the "coordinator" that ties everything together:
 *   OtpService + UserRepository + JwtUtils → complete auth response.
 *
 * Security Implications:
 * - Users are auto-created on first OTP verification (no separate signup step needed)
 * - We never store raw passwords for OTP-only users (a random UUID hash is used instead)
 * - Same error messages are used for all failure cases to prevent email enumeration
 *
 * Industry Comparison:
 * Supabase Magic Links, Linear's "magic login", and Notion's email login all
 * work on the same pattern: verify email ownership → issue session token.
 */

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final OtpService otpService;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtils jwtUtils,
                       OtpService otpService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
        this.otpService = otpService;
    }

    // ── OTP FLOW ─────────────────────────────────────────────────────────────
    /**
     * Step 1: Request OTP
     *
     * Simply normalizes the email and delegates to OtpService.
     * We intentionally do NOT check if the email exists in our users table here.
     *
     * Why not check if the user exists first?
     * If we returned a different error for "email not found" vs "email found",
     * attackers could use our API to enumerate valid email addresses on our platform.
     * (This is called an "email enumeration attack".)
     * By always sending an OTP regardless, we reveal nothing about who is registered.
     *
     * @param request Contains the email to send the OTP to
     */
    public void requestOtp(OtpRequestDTO request) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new RuntimeException("Email address is required.");
        }
        String email = request.getEmail().trim().toLowerCase();
        otpService.generateAndSendOtp(email);
    }
    /**
     * Step 2: Verify OTP → Issue JWT
     *
     * Flow:
     *   1. Verify the OTP using OtpService (handles expiry, attempts, hash matching)
     *   2. Find the user in our DB by email, OR auto-create them if they're new
     *   3. Generate a signed JWT token
     *   4. Return the token + safe user data to the frontend
     *
     * Auto-creation on first login:
     * If a user verifies their email for the first time, they don't have an account yet.
     * We automatically create one — this merges the "signup" and "login" flows into one.
     * This is exactly how Notion, Linear, and Vercel's email login works.
     *
     * Name for new users:
     * We use the email prefix (part before "@") as a default name, e.g.:
     *   "john.doe@company.com" → name = "john.doe"
     * Users can update their name later in profile settings.
     *
     * @param request Contains email and the 6-digit OTP
     * @return AuthResponseDTO with JWT token and safe user details
     */
    public AuthResponseDTO verifyOtp(OtpVerifyDTO request) {
        if (request.getEmail() == null || request.getOtp() == null) {
            throw new RuntimeException("Email and verification code are required.");
        }
        String email = request.getEmail().trim().toLowerCase();
        String otp = request.getOtp().trim();
        // 1. Verify the OTP (throws descriptive exceptions on failure)
        otpService.verifyOtp(email, otp);
        // 2. Find existing user OR auto-create a new one
        User user = userRepository.findByEmail(email).orElseGet(() -> {
            // First-time login — auto-create user account
            User newUser = new User();
            newUser.setEmail(email);
            // Derive a friendly default name from the email prefix
            // e.g., "john.doe@gmail.com" → "john.doe"
            String defaultName = email.contains("@")
                ? email.substring(0, email.indexOf("@"))
                : email;
            newUser.setName(defaultName);
            // For OTP-only users, we store an unreachable random hash as the "password".
            // Nobody knows this value — it can never be used to log in via the old flow.
            // This keeps the NOT NULL constraint on password_hash satisfied.
            newUser.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString()));
            return userRepository.save(newUser);
        });
        // 3. Generate a signed JWT for this user's session
        String token = jwtUtils.generateToken(user.getEmail());
        // 4. Build and return the safe response (no password hash exposed)
        UserResponseDTO userDTO = new UserResponseDTO(
            user.getId(),
            user.getName(),
            user.getEmail(),
            user.getCreatedAt()
        );
        return new AuthResponseDTO(token, userDTO);
    }
    // ── LEGACY PASSWORD FLOWS (kept for backward compatibility) ──────────────
    /** Creates a new account with a password. */
    public AuthResponseDTO signup(SignupRequestDTO request) {

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("A user with this email already exists.");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail().trim().toLowerCase());

        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));

        User saved = userRepository.save(user);

        String token = jwtUtils.generateToken(saved.getEmail());
        UserResponseDTO userDTO = new UserResponseDTO(
                saved.getId(), saved.getName(), saved.getEmail(), saved.getCreatedAt());

        return new AuthResponseDTO(token, userDTO);
    }

   /** Authenticates with email + password. */
    public AuthResponseDTO login(LoginRequestDTO request) {
        User user = userRepository.findByEmail(request.getEmail().trim().toLowerCase())
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
