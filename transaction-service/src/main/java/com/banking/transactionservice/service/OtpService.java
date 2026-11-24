package com.banking.transactionservice.service;

import com.banking.transactionservice.config.OtpProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.HexFormat;

/**
 * OTPs for transfers that need the sender's confirmation, kept in Redis:
 * <pre>
 *   key   transaction:otp:{transactionId}
 *   value SHA-256 hash of the 6-digit OTP (the OTP itself is never stored)
 *   TTL   transaction.otp.expiry-minutes - Redis deletes the key when the OTP expires
 * </pre>
 * Wrong-attempt counting stays on the (row-locked) Transaction, see TransactionService#verifyOTP.
 */
@Service
@RequiredArgsConstructor
public class OtpService {

    static final String KEY_PREFIX = "transaction:otp:";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final StringRedisTemplate redisTemplate;
    private final OtpProperties otpProperties;

    public enum Result { VALID, WRONG, EXPIRED }

    /** Creates a new OTP for the transaction (replacing any previous one) and returns it in plain text. */
    public String generate(String transactionId) {
        String otp = "%06d".formatted(RANDOM.nextInt(1_000_000));
        redisTemplate.opsForValue().set(key(transactionId), hash(otp),
                Duration.ofMinutes(otpProperties.expiryMinutes()));
        return otp;
    }

    /** Checks the OTP. A VALID OTP is deleted, so it can't be used twice. */
    public Result verify(String transactionId, String otp) {
        String storedHash = redisTemplate.opsForValue().get(key(transactionId));
        if (storedHash == null) {
            return Result.EXPIRED; // TTL ran out (or it was never issued / already used)
        }
        // Constant-time comparison: response time doesn't reveal how many characters matched.
        if (!MessageDigest.isEqual(hash(otp).getBytes(StandardCharsets.UTF_8),
                storedHash.getBytes(StandardCharsets.UTF_8))) {
            return Result.WRONG;
        }
        delete(transactionId);
        return Result.VALID;
    }

    public void delete(String transactionId) {
        redisTemplate.delete(key(transactionId));
    }

    private static String key(String transactionId) {
        return KEY_PREFIX + transactionId;
    }

    static String hash(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
