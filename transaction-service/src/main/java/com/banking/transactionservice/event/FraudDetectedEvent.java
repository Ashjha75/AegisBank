package com.banking.transactionservice.event;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Published to Kafka topic {@code fraud.detected} when fraud is confirmed on a transfer: too many wrong OTPs,
 * i.e. someone without the sender's OTP tried to move the sender's money.
 * <ul>
 *   <li>account-service BLOCKS {@code senderAccountNumber} (the compromised account).</li>
 *   <li>notification-service warns the sender.</li>
 * </ul>
 * The transfer itself is already FLAGGED and refunded (see transaction.refunded). Sent as JSON, e.g.
 * <pre>{@code
 * {"transactionId":"8c8c...","senderAccountNumber":"758885717853","receiverAccountNumber":"755016767385",
 *  "amount":500.00,"reason":"Too many wrong OTP attempts","detectedAt":"2026-11-24T12:30:05"}
 * }</pre>
 */
public record FraudDetectedEvent(
        String transactionId,
        String senderAccountNumber,
        String receiverAccountNumber,
        BigDecimal amount,
        String reason,
        LocalDateTime detectedAt
) {
}
