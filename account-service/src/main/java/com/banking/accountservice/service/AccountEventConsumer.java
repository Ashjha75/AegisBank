package com.banking.accountservice.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Kafka listeners for account-related events.
 * <p>
 * Exceptions are NOT caught here: they propagate to the error handler in config/KafkaConfig,
 * which retries temporary failures and sends messages that still fail to {@code <topic>-dlt}.
 * Catching and swallowing them would silently lose money movements.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class AccountEventConsumer {

    private final AccountService accountService;

    // No listener for transaction.completed on purpose: transaction-service credits the receiver through
    // InternalAccountController (Feign) and only THEN publishes transaction.completed as a notification.
    // Crediting again here would pay the receiver twice.

    /**
     * Consume fraud.detected event from Kafka (published by transaction-service on too many wrong OTPs). <br>
     * Blocks the SENDER's account: someone without the sender's OTP tried to move the sender's money, so that
     * account is the compromised one. The receiver may be an innocent payee and is not touched.
     */
    @KafkaListener(topics = "fraud.detected")
    public void consumeFraudDetected(@Payload Map<String, Object> payload) {
        log.info("Received fraud.detected event for transaction {}", payload.get("transactionId"));
        String accountNumber = requiredText(payload, "senderAccountNumber");

        log.info("Blocking account {}", accountNumber);
        accountService.blockAccount(accountNumber);
    }

    private static String requiredText(Map<String, Object> payload, String field) {
        Object value = payload.get(field);
        if (value == null || value.toString().isBlank()) {
            throw new IllegalArgumentException("Event is missing required field '" + field + "'");
        }
        return value.toString();
    }
}
