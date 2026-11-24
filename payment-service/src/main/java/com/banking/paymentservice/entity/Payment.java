package com.banking.paymentservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * A payment made through Razorpay into an AegisBank account (e.g. adding money).
 * Never returned from controllers directly - map it to a response DTO.
 */
@Entity
@Table(name = "payments")
// Not @Data: its equals/hashCode use every field (including the generated id), which breaks
// JPA entities in Sets and Hibernate's dirty checking. Getters/setters are all we need.
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    /** Razorpay order id (order_...), set when the order is created. */
    @Column(unique = true)
    private String razorpayOrderId;
    /** Razorpay payment id (pay_...), set once the customer has paid. */
    @Column(unique = true)
    private String razorpayPaymentId;

    /** AegisBank account the money is paid into. */
    @Column(nullable = false)
    private String accountNumber;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    /** ISO 4217 code, e.g. INR. */
    @Builder.Default
    @Column(nullable = false, length = 3)
    private String currency = "INR";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status;

    private String description;
    private String failureReason;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
