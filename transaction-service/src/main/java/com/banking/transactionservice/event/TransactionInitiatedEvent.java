package com.banking.transactionservice.event;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Published to Kafka topic {@code transaction.initiated} after the sender has been debited,
 * so fraud-detection-service can check the transfer. Sent as JSON, e.g.
 * <pre>{@code
 * {"transactionId":"8c8c...","senderAccountNumber":"758885717853","receiverAccountNumber":"755016767385",
 *  "amount":500.00,"description":"rent","initiatedAt":"2026-11-23T12:30:05"}
 * }</pre>
 * A record (immutable), like the DTOs - Jackson writes and reads records without Lombok.
 */
public record TransactionInitiatedEvent(
        String transactionId,
        String senderAccountNumber,
        String receiverAccountNumber,
        BigDecimal amount,
        String description,
        LocalDateTime initiatedAt
) {
}
