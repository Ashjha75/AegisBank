package com.banking.transactionservice.event;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Published to Kafka topic {@code transaction.completed} after the receiver has been credited,
 * i.e. the money has already moved. It is a notification ("transfer done"), not a command:
 * consumers must NOT credit or debit anything because of it. Sent as JSON, e.g.
 * <pre>{@code
 * {"transactionId":"8c8c...","senderAccountNumber":"758885717853","receiverAccountNumber":"755016767385",
 *  "amount":500.00,"description":"rent","completedAt":"2026-11-24T12:30:05"}
 * }</pre>
 * A record (immutable), like TransactionInitiatedEvent - Jackson writes and reads records without Lombok.
 */
public record TransactionCompletedEvent(
        String transactionId,
        String senderAccountNumber,
        String receiverAccountNumber,
        BigDecimal amount,
        String description,
        LocalDateTime completedAt
) {
}
