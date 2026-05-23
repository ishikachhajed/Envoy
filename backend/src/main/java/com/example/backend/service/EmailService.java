package com.example.backend.service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.internet.MimeMessage;
/**
 * EmailService — What this file does:
 * ─────────────────────────────────────
 * This service is responsible for composing and sending real emails via Gmail's SMTP server.
 * It uses Spring Boot's JavaMailSender, which is automatically configured using the
 * Gmail SMTP credentials you provide in application.properties.
 *
 * Why is it needed?
 * Without this service, there is no way to deliver the OTP to the user's inbox.
 * The OTP exists only in our database. The email is the secure "delivery channel"
 * that proves the person requesting access actually controls the email address.
 *
 * What happens if this file is missing?
 * OTPs would be generated and stored in the DB, but never sent to users —
 * making the entire OTP flow impossible.
 *
 * Security Implications:
 * - We send the OTP in the email body (not in a link URL) to prevent log exposure.
 * - Emails are sent over TLS (STARTTLS on port 587) so they're encrypted in transit.
 * - This service sends from a real Gmail account, so emails reliably reach inboxes.
 *
 * Industry Comparison:
 * This is equivalent to SendGrid's transactional email service, Resend, or AWS SES.
 * We use Gmail SMTP for simplicity in local development.
 */
@Service
public class EmailService {
    private final JavaMailSender mailSender;
    @Value("${spring.mail.username}")
    private String senderEmail;
    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }
    /**
     * Sends a professional HTML OTP email to the given address.
     *
     * @param toEmail The recipient's email address
     * @param otp     The plain-text 6-digit OTP (we hash it BEFORE storing in DB)
     */
    public void sendOtpEmail(String toEmail, String otp) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            // MimeMessageHelper allows us to set HTML content and UTF-8 encoding
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(senderEmail, "Envoy Vault Security");
            helper.setTo(toEmail);
            helper.setSubject("🔐 Your Envoy Vault Access Code: " + otp);
            helper.setText(buildOtpEmailHtml(toEmail, otp), true); // true = send as HTML
            mailSender.send(message);
        } catch (Exception e) {
            // Wrapping the checked exception so calling services don't need to handle it
            throw new RuntimeException("Failed to send verification email. Please try again. Error: " + e.getMessage());
        }
    }
    /**
     * Builds a professional, dark-themed HTML email template.
     * Matches the Envoy Vault brand identity (dark background, emerald green accent).
     */
    private String buildOtpEmailHtml(String toEmail, String otp) {
        // Split OTP into individual digits for the spaced-out display
        String[] digits = otp.split("");
        StringBuilder digitBoxes = new StringBuilder();
        for (String d : digits) {
            digitBoxes.append(
                "<span style='display:inline-block;width:48px;height:56px;line-height:56px;" +
                "text-align:center;font-size:28px;font-weight:700;color:#ffffff;" +
                "background:#1a1a1a;border:2px solid #10b981;border-radius:10px;" +
                "margin:0 4px;font-family:monospace;'>" + d + "</span>"
            );
        }
        return "<!DOCTYPE html>" +
            "<html lang='en'>" +
            "<head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1.0'></head>" +
            "<body style='margin:0;padding:0;background-color:#050505;font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif;'>" +
            "<table width='100%' cellpadding='0' cellspacing='0' style='background:#050505;'>" +
            "<tr><td align='center' style='padding:40px 20px;'>" +
            "<table width='560' cellpadding='0' cellspacing='0' style='max-width:560px;width:100%;'>" +
            // Header
            "<tr><td style='text-align:center;padding-bottom:32px;'>" +
            "<div style='display:inline-flex;align-items:center;gap:10px;'>" +
            "<div style='width:40px;height:40px;background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.3);border-radius:10px;" +
            "display:inline-block;text-align:center;line-height:40px;font-size:20px;'>🛡️</div>" +
            "<span style='font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;'>Envoy Vault</span>" +
            "</div>" +
            "</td></tr>" +
            // Main Card
            "<tr><td style='background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);" +
            "border-radius:16px;padding:40px;backdrop-filter:blur(16px);'>" +
            "<h1 style='color:#ffffff;font-size:22px;font-weight:700;margin:0 0 8px 0;text-align:center;'>Your access code</h1>" +
            "<p style='color:#a3a3a3;font-size:15px;margin:0 0 32px 0;text-align:center;line-height:1.6;'>" +
            "Use the code below to sign in to Envoy Vault.<br>" +
            "This code expires in <strong style='color:#10b981;'>5 minutes</strong>." +
            "</p>" +
            // OTP digits
            "<div style='text-align:center;margin:32px 0;'>" +
            digitBoxes.toString() +
            "</div>" +
        
            "<div style='border-top:1px solid rgba(255,255,255,0.08);margin:32px 0;'></div>" +
        
            "<div style='background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.15);border-radius:10px;padding:16px;'>" +
            "<p style='color:#a3a3a3;font-size:13px;margin:0;line-height:1.6;'>" +
            "🔒 <strong style='color:#10b981;'>Security Notice:</strong> " +
            "Envoy Vault will never ask for this code over phone or chat. " +
            "If you did not request this code, you can safely ignore this email." +
            "</p>" +
            "</div>" +
            "</td></tr>" +

            "<tr><td style='text-align:center;padding-top:24px;'>" +
            "<p style='color:#525252;font-size:12px;margin:0;'>Sent to " + toEmail + " · Envoy Vault · Enterprise Secrets Management</p>" +
            "</td></tr>" +
            "</table>" +
            "</td></tr>" +
            "</table>" +
            "</body></html>";
    }
}