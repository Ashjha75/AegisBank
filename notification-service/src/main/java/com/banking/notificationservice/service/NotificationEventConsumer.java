package com.banking.notificationservice.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Kafka listeners for every event a customer is alerted about.
 * <pre>
 *  transaction-service:  transaction.otp.generated, transaction.initiated, transaction.completed,
 *                        transaction.refunded, fraud.detected
 *  payment-service:      payment.completed, payment.failed
 * </pre>
 * Exceptions are not caught here: the DefaultErrorHandler (config/KafkaConfig) retries, then sends the
 * message to {@code <topic>-dlt}.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class NotificationEventConsumer {

    private final NotificationService notificationService;

    // ---------------------------------------------------------------- transaction-service

    /**
     * Consume OTP generated event
     * <br>
     * Notify the sender with the OTP to confirm a suspicious or high-value transfer.
     */
    @KafkaListener(topics = "transaction.otp.generated")
    public void consumeOTPGenerated(@Payload Map<String, Object> payload) {
        log.info("Received OTP generated event for transaction {}", payload.get("transactionId"));
        notificationService.sendAlertNotification(payload);
    }

    /**
     * Consume transaction initiated event
     * <br>
     * Notify the sender that the money was debited and the transfer is being processed.
     */
    @KafkaListener(topics = "transaction.initiated")
    public void consumeTransactionInitiated(@Payload Map<String, Object> payload) {
        log.info("Received transaction initiated event for transaction {}", payload.get("transactionId"));
        notificationService.sendInitiatedAlertNotification(payload);
    }

    /**
     * Consume transaction completed event
     * <br>
     * Notify the sender (money sent) and the receiver (money received).
     */
    @KafkaListener(topics = "transaction.completed")
    public void consumeTransactionCompleted(@Payload Map<String, Object> payload) {
        log.info("Received transaction completed event for transaction {}", payload.get("transactionId"));
        notificationService.sendCompletedAlertNotification(payload);
    }

    /**
     * Consume transaction refunded event
     * <br>
     * Notify the sender that the transfer was cancelled and the money returned.
     */
    @KafkaListener(topics = "transaction.refunded")
    public void consumeTransactionRefunded(@Payload Map<String, Object> payload) {
        log.info("Received transaction refunded event for transaction {}", payload.get("transactionId"));
        notificationService.sendRefundedAlertNotification(payload);
    }

    /**
     * Consume fraud detected event
     * <br>
     * Warn the sender that their account was blocked after suspected fraud.
     */
    @KafkaListener(topics = "fraud.detected")
    public void consumeFraudDetected(@Payload Map<String, Object> payload) {
        log.info("Received fraud detected event for transaction {}", payload.get("transactionId"));
        notificationService.sendFraudAlertNotification(payload);
    }

    // ---------------------------------------------------------------- payment-service

    /**
     * Consume payment completed event
     * <br>
     * Notify the account holder that their Razorpay payment succeeded.
     */
    @KafkaListener(topics = "payment.completed")
    public void consumePaymentCompleted(@Payload Map<String, Object> payload) {
        log.info("Received payment completed event for payment {}", payload.get("paymentId"));
        notificationService.sendPaymentCompletedAlertNotification(payload);
    }

    /**
     * Consume payment failed event
     * <br>
     * Notify the account holder that their Razorpay payment failed.
     */
    @KafkaListener(topics = "payment.failed")
    public void consumePaymentFailed(@Payload Map<String, Object> payload) {
        log.info("Received payment failed event for payment {}", payload.get("paymentId"));
        notificationService.sendPaymentFailedAlertNotification(payload);
    }
}
