package com.example.backend.dto;
public class OtpRequestDTO {
    private String email;
    // Jackson (the JSON library) needs this empty constructor
    public OtpRequestDTO() {}
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}