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
     * Consume fraud.detected event from Kafka. <br>
     * Blocks the flagged account.
     */
    @KafkaListener(topics = "fraud.detected")
    public void consumeFraudDetected(@Payload Map<String, Object> payload) {
        log.info("Received fraud.detected event: {}", payload);
        // TODO: confirm with fraud-detection-service which account to block - the sender (compromised
        //  account draining money) is usually the one to block, but this reads receiverAccountNumber.
        String accountNumber = requiredText(payload, "receiverAccountNumber");

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
