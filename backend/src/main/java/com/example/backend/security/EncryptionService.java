package com.example.backend.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * EncryptionService: Upgraded production-grade cryptographic utility.
 * Uses AES-GCM-256 authenticated encryption with unique secure-random IVs.
 */
@Service
public class EncryptionService {

    @Value("${envoy.encryption.key}")
    private String secretKey;

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_TAG_LENGTH = 128; // standard AEAD authentication tag bit-length
    private static final int IV_SIZE = 12; // GCM optimal 12-byte IV

    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * Carrier container holding base64-encoded encrypted text and its initialization vector.
     */
    public static class EncryptedResult {
        private final String ciphertext;
        private final String iv;

        public EncryptedResult(String ciphertext, String iv) {
            this.ciphertext = ciphertext;
            this.iv = iv;
        }

        public String getCiphertext() {
            return ciphertext;
        }

        public String getIv() {
            return iv;
        }
    }

    /**
     * Encrypts plaintext data under AES-GCM-256. Generates a distinct IV for each operation.
     */
    public EncryptedResult encrypt(String data) throws Exception {
        byte[] ivBytes = new byte[IV_SIZE];
        secureRandom.nextBytes(ivBytes);

        SecretKeySpec keySpec = new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "AES");
        Cipher cipher = Cipher.getInstance(ALGORITHM);
        GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH, ivBytes);

        cipher.init(Cipher.ENCRYPT_MODE, keySpec, gcmSpec);
        byte[] encryptedBytes = cipher.doFinal(data.getBytes(StandardCharsets.UTF_8));

        String ciphertext = Base64.getEncoder().encodeToString(encryptedBytes);
        String ivStr = Base64.getEncoder().encodeToString(ivBytes);

        return new EncryptedResult(ciphertext, ivStr);
    }

    /**
     * Decrypts ciphertext data under AES-GCM-256. Requires corresponding IV block.
     */
    public String decrypt(String encryptedData, String ivStr) throws Exception {
        byte[] ivBytes = Base64.getDecoder().decode(ivStr);
        byte[] decodedBytes = Base64.getDecoder().decode(encryptedData);

        SecretKeySpec keySpec = new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "AES");
        Cipher cipher = Cipher.getInstance(ALGORITHM);
        GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH, ivBytes);

        cipher.init(Cipher.DECRYPT_MODE, keySpec, gcmSpec);
        byte[] decryptedBytes = cipher.doFinal(decodedBytes);

        return new String(decryptedBytes, StandardCharsets.UTF_8);
    }
}