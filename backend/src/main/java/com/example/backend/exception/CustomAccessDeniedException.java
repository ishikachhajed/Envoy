package com.example.backend.exception;

/**
 * CustomAccessDeniedException: Thrown when an authenticated user attempts an operation 
 * that violates role-based SaaS access constraints (e.g., MEMBER deleting a secret).
 * Maps cleanly to HTTP 403 Forbidden.
 */
public class CustomAccessDeniedException extends RuntimeException {
    public CustomAccessDeniedException(String message) {
        super(message);
    }
}
