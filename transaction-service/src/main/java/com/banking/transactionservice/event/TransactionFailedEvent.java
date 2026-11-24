package com.banking.transactionservice.event;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Published to Kafka topic {@code transaction.failed} when a transfer ends without the receiver being credited:
 * <ul>
 *   <li>status FAILED  - sender could not be debited, or the receiver credit failed (sender refunded)</li>
 *   <li>status FLAGGED - OTP expired or too many wrong OTPs (sender refunded)</li>
 * </ul>
 * Informational only (read by notification-service) - nobody may move money because of it. Sent as JSON, e.g.
 * <pre>{@code
 * {"transactionId":"8c8c...","senderAccountNumber":"758885717853","receiverAccountNumber":"755016767385",
 *  "amount":500.00,"status":"FLAGGED","reason":"OTP expired (sender refunded)","failedAt":"2026-11-24T12:30:05"}
 * }</pre>
 */
public record TransactionFailedEvent(
        String transactionId,
        String senderAccountNumber,
        String receiverAccountNumber,
        BigDecimal amount,
        String status,
        String reason,
        LocalDateTime failedAt
) {
}
