package com.banking.accountservice.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
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

    /**
     * Consume transaction.completed event from Kafka. <br>
     * Credit receiver account.
     */
    @KafkaListener(topics = "transaction.completed")
    public void consumeTransactionCompleted(@Payload Map<String, Object> payload) {
        log.info("Received transaction.completed event: {}", payload);
        String receiverAccountNumber = requiredText(payload, "receiverAccountNumber");
        BigDecimal amount = requiredAmount(payload, "amount");

        log.info("Crediting account {} with amount: {}", receiverAccountNumber, amount);
        accountService.creditBalance(receiverAccountNumber, amount);
    }

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

    /**
     * JSON numbers arrive in a Map as Integer/Long/Double - never BigDecimal - so a cast would throw.
     * Converting via toString() keeps the exact decimal value (no floating-point rounding).
     */
    private static BigDecimal requiredAmount(Map<String, Object> payload, String field) {
        String text = requiredText(payload, field);
        try {
            return new BigDecimal(text);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Event field '" + field + "' is not a number: " + text, e);
        }
    }
}
