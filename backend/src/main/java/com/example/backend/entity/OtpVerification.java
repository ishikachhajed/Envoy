package com.example.backend.entity;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import java.util.UUID;
/**
 * OtpVerification — What this file does:
 * ─────────────────────────────────────
 * This is a database table definition (JPA Entity) that stores One-Time Passwords.
 *
 * Why is it needed?
 * When a user types their email and clicks "Send Code", we generate a 6-digit code,
 * hash it (so even if the DB is breached, the raw OTP isn't exposed), and save it here.
 * When the user submits the code, we look up this record, check expiry, check attempts,
 * compare the hash, and then mark it as "used" so it can never be replayed.
 *
 * What happens if this file is missing?
 * There would be nowhere to store OTPs — every verification attempt would fail.
 *
 * Industry Comparison:
 * Supabase, Auth0, and Firebase all use a similar short-lived verification token pattern.
 */
@Entity
@Table(name = "otp_verifications")
public class OtpVerification {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    /** The email address this OTP was issued for. */
    @Column(nullable = false)
    private String email;
    
    @Column(name = "otp_hash", nullable = false)
    private String otpHash;
    /** When this OTP stops being valid. Set to 5 minutes from creation. */
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;
    /**
     * Whether this OTP has already been used for a successful login.
     * Once true, this OTP is permanently dead and cannot be replayed.
     * This prevents "replay attacks" where an attacker intercepts an OTP and uses it again.
     */
    @Column(nullable = false)
    private boolean used = false;
    /**
     * Tracks how many wrong codes the user has submitted.
     * After 5 bad attempts, the OTP is permanently invalidated.
     * This prevents "brute-force attacks" where an attacker tries all 1,000,000 combinations.
     */
    @Column(nullable = false)
    private int attempts = 0;
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getOtpHash() { return otpHash; }
    public void setOtpHash(String otpHash) { this.otpHash = otpHash; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
    public boolean isUsed() { return used; }
    public void setUsed(boolean used) { this.used = used; }
    public int getAttempts() { return attempts; }
    public void setAttempts(int attempts) { this.attempts = attempts; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}