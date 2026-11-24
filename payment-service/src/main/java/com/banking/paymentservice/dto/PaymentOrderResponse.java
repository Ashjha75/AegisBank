package com.banking.paymentservice.dto;

import com.banking.paymentservice.entity.PaymentStatus;

import java.math.BigDecimal;

/**
 * Returned after a Razorpay order is created. The client passes razorpayOrderId, amount, currency and
 * razorpayKeyId to Razorpay Checkout to open the payment window.
 *
 * @param paymentId       our Payment id
 * @param razorpayOrderId Razorpay order id (order_...)
 * @param amount          amount in rupees (Razorpay itself works in paise)
 * @param currency        ISO 4217 code, e.g. INR
 * @param status          payment status, CREATED right after the order is made
 * @param razorpayKeyId   PUBLIC Razorpay key id for Checkout - never the key secret
 */
public record PaymentOrderResponse(
        String paymentId,
        String razorpayOrderId,
        BigDecimal amount,
        String currency,
        PaymentStatus status,
        String razorpayKeyId
) {
}
