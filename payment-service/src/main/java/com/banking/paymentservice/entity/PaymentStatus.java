package com.banking.paymentservice.entity;

/**
 * Lifecycle of a Razorpay payment.
 * <pre>
 *   CREATED  Razorpay order created, waiting for the customer to pay
 *   SUCCESS  payment captured and signature verified
 *   FAILED   payment failed or signature invalid (see Payment.failureReason)
 * </pre>
 */
public enum PaymentStatus {
    CREATED,
    SUCCESS,
    FAILED
}
