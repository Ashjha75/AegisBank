package com.banking.transactionservice.service;

import com.banking.transactionservice.config.KafkaConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Reads fraud-detection-service's verdict for a transfer and hands it to TransactionService.
 * Exceptions are not caught: the DefaultErrorHandler (KafkaConfig) retries, then sends the
 * message to {@code <topic>-dlt}.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class TransactionEventConsumer {

    private final TransactionService transactionService;

    /** Fraud checks passed: credit the receiver (or ask for an OTP if the amount is above the threshold). */
    @KafkaListener(topics = KafkaConfig.FRAUD_CHECK_CLEAN_TOPIC)
    public void consumeFraudCheckClean(@Payload Map<String, Object> payload) {
        String transactionId = requiredText(payload, "transactionId");
        log.info("Received fraud.check.clean for transaction {}", transactionId);
        transactionService.handleFraudCheckClean(transactionId);
    }

    /** Transfer looks suspicious: generate an OTP and ask the sender to verify. */
    @KafkaListener(topics = KafkaConfig.VERIFICATION_REQUIRED_TOPIC)
    public void consumeVerificationRequired(@Payload Map<String, Object> payload) {
        String transactionId = requiredText(payload, "transactionId");
        Object reason = payload.get("reason");
        log.info("Received verification.required for transaction {}: {}", transactionId, reason);
        transactionService.handleVerificationRequired(transactionId, reason == null ? null : reason.toString());
    }

    private static String requiredText(Map<String, Object> payload, String field) {
        Object value = payload.get(field);
        if (value == null || value.toString().isBlank()) {
            throw new IllegalArgumentException("Event is missing required field '" + field + "'");
        }
        return value.toString();
    }
}
