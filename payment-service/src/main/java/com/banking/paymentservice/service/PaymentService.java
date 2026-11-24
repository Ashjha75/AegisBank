package com.banking.paymentservice.service;

import com.banking.paymentservice.dto.CreatePaymentRequest;
import com.banking.paymentservice.dto.PaymentOrderResponse;
import com.banking.paymentservice.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/**
 * Razorpay payments into AegisBank accounts.
 * <p>
 * SKELETON - not implemented yet. Each method answers 501 Not Implemented until its logic is added.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;

    /**
     * TODO: save Payment (CREATED), create the Razorpay order (amount in paise), store razorpayOrderId,
     *  return it with the public Razorpay key id for Checkout.
     */
    public PaymentOrderResponse createPaymentOrder(CreatePaymentRequest request) {
        throw notImplemented("createPaymentOrder");
    }

    /**
     * TODO: verify the X-Razorpay-Signature (HMAC-SHA256 of the raw body with the webhook secret), then on
     *  payment.captured mark the Payment COMPLETED and credit the account; on payment.failed mark it FAILED.
     *  Lock the row with findByRazorpayOrderIdForUpdate - Razorpay can deliver the same webhook twice.
     *
     * @param payload   raw request body, exactly as Razorpay sent it (needed for the signature check)
     * @param signature value of the X-Razorpay-Signature header
     */
    public void handleWebhook(String payload, String signature) {
        throw notImplemented("handleWebhook");
    }

    private static ResponseStatusException notImplemented(String operation) {
        return new ResponseStatusException(HttpStatus.NOT_IMPLEMENTED, operation + " is not implemented yet");
    }
}
