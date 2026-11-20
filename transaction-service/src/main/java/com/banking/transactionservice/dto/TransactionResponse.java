package com.banking.transactionservice.dto;

import com.banking.transactionservice.entity.TransactionStatus;
import com.banking.transactionservice.entity.TransactionType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TransactionResponse
        (String id,
         String senderAccountNumber,
         String receiverAccountNumber,
         BigDecimal amount,
         TransactionType type,
         TransactionStatus status,
         String description,
         String failureReason,
         String referenceNumber,
         LocalDateTime createdAt,
         LocalDateTime completedAt) {
}
