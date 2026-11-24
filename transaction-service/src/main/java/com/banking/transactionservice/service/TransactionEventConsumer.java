package com.banking.transactionservice.service;

import com.banking.transactionservice.entity.Transaction;
import com.banking.transactionservice.entity.TransactionStatus;
import com.banking.transactionservice.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class TransactionEventConsumer {
    private final TransactionRepository transactionRepository;
    private final RedisTemplate<String, String> redisTemplate;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private static  final String TRANSACTION_OTP_GENERATED_TOPIC = "transaction.otp-generated";
    private static final long OTP_EXPIRATION_MINUTES = 5;

    /**
     * Consume verification required
     * </br>
     * Generate OTP and ask user to verify
     *
     * @param payload verification-required event data
     */
    @SuppressWarnings("unused")
    public void consumeVerificationRequiredEvent(@Payload Map<String, Object> payload) {
        try {
            String transactionId = (String) payload.get("transactionId");
            String accountId = (String) payload.get("accountId");
            String reason = (String) payload.get("reason");
            log.info("Verification required for transaction {} on account {} due to reason: {}", transactionId, accountId, reason);

            Transaction transaction = transactionRepository.findById(transactionId).orElseThrow(() -> new RuntimeException("Transaction not found"));
//            Added Idempotency Guard to avoid  double credit processing
            if (transaction.getStatus() != TransactionStatus.PROCESSING) {
                log.info("Transaction {} is not in PROCESSING state. Current state: {}. Skipping verification.", transactionId, transaction.getStatus());
                return;
            }

            // Generate OTP with simple logic for now
            String otp = String.format("%06d", (int) (Math.random() * 900000) + 100000);
            // Store OTP in Redis-expires in 5 minutes
            redisTemplate.opsForValue().set("otp:" + transactionId, otp, Duration.ofMinutes(OTP_EXPIRATION_MINUTES));

//            Update the transaction status to PENDING_VERIFICATION
            transaction.setStatus(TransactionStatus.PENDING_VERIFICATION);
            transactionRepository.save(transaction);

            log.info("Generated OTP {} for transaction {}. OTP will expire in {} minutes.", otp, transactionId, OTP_EXPIRATION_MINUTES);

//            Notify to user

            Map<String, Object> otpEvent = new HashMap<>();
            otpEvent.put("transactionId", transactionId);
            otpEvent.put("accountId", accountId);
            otpEvent.put("reason", reason);
            otpEvent.put("otp", otp);
            kafkaTemplate.send(TRANSACTION_OTP_GENERATED_TOPIC,transactionId, otpEvent);


        } catch (Exception e) {
            log.error("Error processing verification-required event: {}", e.getMessage(), e);
            throw new RuntimeException(e);
        }

    }
}
