package com.example.backend.service;
import com.example.backend.entity.OtpVerification;
import com.example.backend.repository.OtpVerificationRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.security.SecureRandom;
import java.time.LocalDateTime;
/**
 * OtpService — What this file does:
 * ──────────────────────────────────
 * This is the core security engine for the OTP authentication flow.
 * It handles the full lifecycle of a One-Time Password:
 *   1. Generating a cryptographically random 6-digit code
 *   2. Hashing it before storage (so raw OTPs never touch the DB)
 *   3. Persisting it with an expiry timestamp
 *   4. Triggering the email delivery
 *   5. Verifying submitted codes against stored hashes
 *   6. Enforcing expiry and brute-force protections
 *
 * Why is it needed?
 * Without this service, we have no secure way to generate, store, or validate OTPs.
 * Putting all OTP logic here (rather than in the AuthService) follows the
 * "Single Responsibility Principle" — each service does one job well.
 *
 * What happens if this file is missing?
 * The AuthController would have no way to generate or verify OTPs.
 *
 * Security Implications:
 * - Uses SecureRandom (not Random) — SecureRandom is cryptographically unpredictable.
 *   Java's Random class is NOT safe for security — it can be predicted.
 * - OTPs are BCrypt-hashed before storage — same protection as passwords.
 * - Max 5 attempts before OTP is invalidated — prevents brute-force of 1,000,000 combos.
 * - OTPs expire after 5 minutes — limits the attack window.
 * - Deletes old OTPs before generating new ones — prevents accumulation of stale codes.
 */
@Service
public class OtpService {
    private final OtpVerificationRepository otpRepo;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    /** OTP valid for 5 minutes — standard for enterprise auth flows */
    private static final int OTP_EXPIRY_MINUTES = 5;
    /** Block verification after 5 wrong guesses — prevents brute-force */
    private static final int MAX_ATTEMPTS = 5;
    public OtpService(OtpVerificationRepository otpRepo,
                      PasswordEncoder passwordEncoder,
                      EmailService emailService) {
        this.otpRepo = otpRepo;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }
    /**
     * Generates a new OTP for the given email, persists it hashed, and sends the email.
     *
     * Flow:
     *   1. Delete any existing OTPs for this email (cleanup)
     *   2. Generate a cryptographically secure 6-digit code
     *   3. Hash the code with BCrypt (same algorithm used for passwords)
     *   4. Persist the hashed OTP with a 5-minute expiry window
     *   5. Send the raw OTP to the user's inbox via EmailService
     *
     * Why delete old OTPs first?
     * Without cleanup, users could accumulate dozens of stale OTP rows.
     * It also ensures there's only ONE valid OTP per email at any time.
     *
     * @param email The email address to send the OTP to
     */
    public void generateAndSendOtp(String email) {
        // 1. Delete old OTPs for this email so there's only one valid code at a time
        otpRepo.deleteByEmail(email.toLowerCase());
        // 2. Generate a cryptographically secure random 6-digit number
        String otp = generateSecureOtp();
        // 3. Hash the OTP before storing — we NEVER store raw OTPs in the database
        //    This protects users even if our database is ever compromised
        String otpHash = passwordEncoder.encode(otp);
        // 4. Build and persist the OTP record
        OtpVerification verification = new OtpVerification();
        verification.setEmail(email.toLowerCase());
        verification.setOtpHash(otpHash);
        verification.setExpiresAt(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES));
        verification.setUsed(false);
        verification.setAttempts(0);
        otpRepo.save(verification);
        // 5. Send the plain-text OTP via email (it's hashed in DB but we send the real one)
        emailService.sendOtpEmail(email, otp);
    }
    /**
     * Verifies a submitted OTP against the stored hash for the given email.
     *
     * Security Checks (in order):
     *   1. Does an OTP record exist for this email?
     *   2. Has this OTP already been used?
     *   3. Has this OTP expired?
     *   4. Has the user exceeded the maximum retry attempts?
     *   5. Does the submitted code match the stored hash?
     *
     * If all checks pass → marks OTP as used and returns true.
     * If any check fails → throws a descriptive RuntimeException (400-level errors).
     *
     * @param email        The email address whose OTP to verify
     * @param submittedOtp The raw 6-digit code the user typed in
     * @return true if verification passed
     */
    public boolean verifyOtp(String email, String submittedOtp) {
        // 1. Find the most recent OTP record for this email
        OtpVerification verification = otpRepo
                .findTopByEmailOrderByCreatedAtDesc(email.toLowerCase())
                .orElseThrow(() -> new RuntimeException("No verification code was requested for this email. Please request a new code."));
        // 2. Reject already-used OTPs (prevents replay attacks)
        if (verification.isUsed()) {
            throw new RuntimeException("This code has already been used. Please request a new verification code.");
        }
        // 3. Reject expired OTPs
        if (LocalDateTime.now().isAfter(verification.getExpiresAt())) {
            throw new RuntimeException("Your verification code has expired. Please request a new one.");
        }
        // 4. Reject if too many wrong attempts have been made
        if (verification.getAttempts() >= MAX_ATTEMPTS) {
            throw new RuntimeException("Too many incorrect attempts. Please request a new verification code.");
        }
        // 5. BCrypt-compare the submitted code against the stored hash
        if (!passwordEncoder.matches(submittedOtp, verification.getOtpHash())) {
            // Increment the bad attempt counter and save
            verification.setAttempts(verification.getAttempts() + 1);
            otpRepo.save(verification);
            int remaining = MAX_ATTEMPTS - verification.getAttempts();
            throw new RuntimeException("Invalid verification code. " + remaining + " attempt(s) remaining.");
        }
        // All checks passed — mark OTP as permanently used
        verification.setUsed(true);
        otpRepo.save(verification);
        return true;
    }
    /**
     * Generates a cryptographically secure 6-digit numeric OTP.
     *
     * Why SecureRandom instead of Random?
     * Java's standard Random class uses a predictable algorithm. If an attacker
     * knows the seed, they can predict all future numbers. SecureRandom uses OS-level
     * entropy sources (hardware events, system noise) making it truly unpredictable.
     * This is required for any security-sensitive random number generation.
     */
    private String generateSecureOtp() {
        SecureRandom random = new SecureRandom();
        // 100000–999999 ensures we always get exactly 6 digits (no leading zeros)
        int otp = 100000 + random.nextInt(900000);
        return String.valueOf(otp);
    }
}