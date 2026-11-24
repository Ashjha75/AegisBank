package com.banking.paymentservice.entity;

/**
 * Lifecycle of a Razorpay payment.
 * <pre>
 *   CREATED  Razorpay order created, waiting for the customer to pay
 *   PENDING  payment is in progress
 *   COMPLETED  payment completed successfully
 *   FAILED   payment failed or signature invalid (see Payment.failureReason)
 *   REFUNDED  payment has been refunded
 * </pre>
 */
public enum PaymentStatus {
    CREATED,
    PENDING,
    COMPLETED,
    FAILED,
    REFUNDED
}
