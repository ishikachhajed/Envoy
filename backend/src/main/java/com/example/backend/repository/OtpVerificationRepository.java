package com.example.backend.repository;
import com.example.backend.entity.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;
import java.util.UUID;
/**
 * OtpVerificationRepository — What this file does:
 * ─────────────────────────────────────────────────
 * This is a Spring Data JPA "Repository" — a magic interface that auto-generates
 * all database SQL for us without writing any SQL manually.
 *
 * Why is it needed?
 * The OtpService needs to be able to:
 *   1. Find the latest OTP record for an email (to verify against)
 *   2. Delete all old OTPs for an email (cleanup before generating a new one)
 *
 * What happens if this file is missing?
 * The OtpService would have no way to read or write OTP records to the database.
 *
 * Industry Comparison:
 * Similar to Prisma Client (Node.js), ActiveRecord (Rails), or Eloquent (Laravel).
 */
public interface OtpVerificationRepository extends JpaRepository<OtpVerification, UUID> {
    /**
     * Finds the most recently created OTP for a given email.
     * Spring auto-generates this SQL:
     *   SELECT * FROM otp_verifications WHERE email = ? ORDER BY created_at DESC LIMIT 1
     */
    Optional<OtpVerification> findTopByEmailOrderByCreatedAtDesc(String email);
    /**
     * Deletes all OTP records for a given email.
     * This is called before generating a fresh OTP so users can't accumulate stale codes.
     * The @Transactional annotation ensures this DELETE runs inside a database transaction.
     */
    @Transactional
    void deleteByEmail(String email);
}