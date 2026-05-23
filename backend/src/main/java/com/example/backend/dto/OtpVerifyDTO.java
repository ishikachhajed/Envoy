package com.example.backend.dto;
public class OtpVerifyDTO {
    private String email;
    private String otp;
    // Jackson needs this empty constructor
    public OtpVerifyDTO() {}
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getOtp() { return otp; }
    public void setOtp(String otp) { this.otp = otp; }
}