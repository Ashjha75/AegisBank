package com.banking.transactionservice.event;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Published to Kafka topic {@code transaction.refunded} after the sender got the deducted amount back
 * (SAGA compensation): receiver credit failed, OTP expired, or too many wrong OTPs.
 * Informational only (notification-service) - the refund has already happened. Sent as JSON, e.g.
 * <pre>{@code
 * {"transactionId":"8c8c...","senderAccountNumber":"758885717853","receiverAccountNumber":"755016767385",
 *  "amount":500.00,"reason":"OTP expired (sender refunded)","refundedAt":"2026-11-24T12:30:05"}
 * }</pre>
 */
public record TransactionRefundedEvent(
        String transactionId,
        String senderAccountNumber,
        String receiverAccountNumber,
        BigDecimal amount,
        String reason,
        LocalDateTime refundedAt
) {
}
