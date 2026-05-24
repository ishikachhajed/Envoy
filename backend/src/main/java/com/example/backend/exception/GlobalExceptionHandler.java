package com.example.backend.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // Handles duplicate email on registration → 400 Bad Request
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> handleDataViolation(DataIntegrityViolationException ex) {
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("error", "Database Error");
        errorResponse.put("message", "Database constraint violated. Please check your IDs or unique fields.");
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    // Handles role boundary errors (e.g. MEMBER revealing secrets) → 403 Forbidden
    // IMPORTANT: This MUST be declared BEFORE RuntimeException handler.
    // CustomAccessDeniedException extends RuntimeException, so Spring's first-match
    // rule would have the RuntimeException handler catch it first if the order is wrong.
    @ExceptionHandler(CustomAccessDeniedException.class)
    public ResponseEntity<Map<String, String>> handleAccessDenied(CustomAccessDeniedException ex) {
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("error", "Forbidden");
        errorResponse.put("message", ex.getMessage());
        return new ResponseEntity<>(errorResponse, HttpStatus.FORBIDDEN);
    }

    // Handles business logic errors like "User not found!" or "Invalid credentials!" → 400 Bad Request
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException ex) {
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("error", "Request Error");
        // Show root cause message if available (e.g. decryption failures)
        String message = ex.getMessage();
        if (ex.getCause() != null && ex.getCause().getMessage() != null) {
            message = ex.getMessage() + ": " + ex.getCause().getMessage();
        }
        errorResponse.put("message", message);
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    // Fallback for any other unexpected error → 500 Internal Server Error
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGenericException(Exception ex) {
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("error", "Internal Server Error");
        errorResponse.put("message", "Something went wrong. Please try again.");
        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}