package com.banking.transactionservice.entity;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions")
// Not @Data: its equals/hashCode use every field (including the generated id), which breaks
// JPA entities in Sets and Hibernate's dirty checking. Getters/setters are all we need.
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Transaction {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String senderAccountNumber;
    @Column(nullable = false)
    private String receiverAccountNumber;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionStatus status;

    private String description;
    private String failureReason;
    private String referenceNumber;

    // Wrong OTPs entered while PENDING_VERIFICATION. The OTP itself lives in Redis (see OtpService).
    // Never sent to clients (TransactionMapper doesn't copy it).
    @Builder.Default
    // DB default so "ddl-auto: update" can add the column to a table that already has rows
    @Column(nullable = false, columnDefinition = "integer not null default 0")
    private int otpAttempts = 0;

    @CreationTimestamp
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;

}
