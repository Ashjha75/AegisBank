package com.banking.paymentservice.service;

import com.banking.paymentservice.config.RazorpayProperties;
import com.banking.paymentservice.dto.CreatePaymentRequest;
import com.banking.paymentservice.dto.PaymentOrderResponse;
import com.banking.paymentservice.repository.PaymentRepository;
import com.razorpay.RazorpayClient;
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
    /** Shared client from RazorpayConfig, e.g. razorpayClient.orders.create(orderJson). */
    private final RazorpayClient razorpayClient;
    /** keyId() goes into PaymentOrderResponse for Checkout; webhookSecret() verifies webhooks. */
    private final RazorpayProperties razorpayProperties;

    private static  final String  PAYMENT_COMPLETED_TOPIC = "payment.completed";
    private static  final String  PAYMENT_FAILED_TOPIC = "payment.failed";

    /**
     * Create Razorpay payment order
     *<pre>
     * Flow:
     * 1. Create order in Razorpay (with amount, currency, receipt id, etc.)
     * 2. Save the order id in our Payment entity (status CREATED)
     * 3. Return the order id to the frontend.
     * 4. Frontend will use the order id to open Razorpay checkout and complete the payment.
     * 5. Razorpay will call our webhook when the payment is completed or failed.
     * </pre>
     * @param request
     * @return
     */

    public PaymentOrderResponse createPaymentOrder(CreatePaymentRequest request) {
        log.info("Creating payment order for account {} with amount {}", request.accountNumber(), request.amount());

        // TODO: use the injected razorpayClient (don't create a new one per request). Its calls throw the
        //  checked com.razorpay.RazorpayException - catch it here and rethrow an unchecked exception
        //  instead of adding "throws" to the controller.
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
