package com.example.backend.dto;
/**
 * CreateSecretRequestDTO: Inbound request structure for adding a new secret.
 * Restricts input to only the customizable key and value pair.
 */
public class CreateSecretRequestDTO {
    private String key;
    private String value;
    private String reason; // Added for SOC2 change request description
    // Jackson required default constructor
    public CreateSecretRequestDTO() {}
    public CreateSecretRequestDTO(String key, String value) {
        this.key = key;
        this.value = value;
    }
    public CreateSecretRequestDTO(String key, String value, String reason) {
        this.key = key;
        this.value = value;
        this.reason = reason;
    }
    public String getKey() {
        return key;
    }
    public void setValue(String value) {
        this.value = value;
    }
    public String getReason() {
        return reason;
    }
    public void setReason(String reason) {
        this.reason = reason;
    }
}