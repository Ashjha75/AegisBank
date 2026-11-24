package com.banking.notificationservice.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Kafka listeners for the events customers are alerted about (all published by transaction-service).
 * Exceptions are not caught here: the DefaultErrorHandler (config/KafkaConfig) retries, then sends the
 * message to {@code <topic>-dlt}.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class NotificationEventConsumer {

    private final NotificationService notificationService;

    /**
     * Consume OTP generated event
     * <br>
     * Notify the sender with the OTP to confirm a suspicious or high-value transfer.
     *
     * @param payload OTP generated event data
     */
    @KafkaListener(topics = "transaction.otp.generated")
    public void consumeOTPGenerated(@Payload Map<String, Object> payload) {
        log.info("Received OTP generated event for transaction {}", payload.get("transactionId"));
        notificationService.sendAlertNotification(payload);
    }

    /**
     * Consume transaction completed event
     * <br>
     * Notify the sender (money sent) and the receiver (money received).
     *
     * @param payload TransactionCompletedEvent data
     */
    @KafkaListener(topics = "transaction.completed")
    public void consumeTransactionCompleted(@Payload Map<String, Object> payload) {
        log.info("Received transaction completed event for transaction {}", payload.get("transactionId"));
        notificationService.sendCompletedAlertNotification(payload);
    }

    /**
     * Consume transaction failed event
     * <br>
     * Notify the sender that the transfer failed (FAILED) or was blocked (FLAGGED), and whether it was refunded.
     *
     * @param payload TransactionFailedEvent data
     */
    @KafkaListener(topics = "transaction.failed")
    public void consumeTransactionFailed(@Payload Map<String, Object> payload) {
        log.info("Received transaction failed event for transaction {}", payload.get("transactionId"));
        notificationService.sendFailedAlertNotification(payload);
    }
}
