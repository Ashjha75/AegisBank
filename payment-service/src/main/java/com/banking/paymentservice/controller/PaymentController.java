package com.banking.paymentservice.controller;

import com.banking.paymentservice.dto.CreatePaymentRequest;
import com.banking.paymentservice.dto.PaymentOrderResponse;
import com.banking.paymentservice.service.PaymentService;
import com.razorpay.RazorpayException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Client-facing payment APIs, routed by the api-gateway under /api/v1/payments. */
@RestController
@RequestMapping("/api/v1/payments")
@Tag(name = "Payments", description = "Add money to an account through Razorpay")
@Slf4j
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @Operation(summary = "Create a Razorpay payment order",
            description = "Creates a Payment (status CREATED) and a Razorpay order. Pass razorpayOrderId, amount, "
                    + "currency and razorpayKeyId to Razorpay Checkout to let the customer pay.")
    @ApiResponse(responseCode = "201", description = "Order created")
    @ApiResponse(responseCode = "400", description = "Invalid request (e.g. account number not 12 digits, amount <= 0)")
    @PostMapping("/create-order")
    public ResponseEntity<PaymentOrderResponse> createPaymentOrder(@Valid @RequestBody CreatePaymentRequest request) throws RazorpayException {
        log.info("Payment order requested for account {}, amount {}", request.accountNumber(), request.amount());
        return ResponseEntity.status(HttpStatus.CREATED).body(paymentService.createPaymentOrder(request));
    }

    /**
     * Called by Razorpay, not by clients. The body is taken as a raw String: the signature is an HMAC of
     * the exact bytes Razorpay sent, which a Map would not preserve.
     */
    @Operation(summary = "Razorpay webhook",
            description = "Called by Razorpay when a payment is captured or fails. Requests without a valid "
                    + "X-Razorpay-Signature are rejected.")
    @ApiResponse(responseCode = "200", description = "Webhook processed")
    @PostMapping("/webhook")
    public ResponseEntity<String> handleWebhook(
            @RequestBody String payload,
            @Parameter(description = "HMAC-SHA256 of the raw body, signed with the webhook secret")
            @RequestHeader("X-Razorpay-Signature") String signature) {
        log.info("Razorpay webhook received");
        paymentService.handleWebhook(payload, signature);
        return ResponseEntity.ok("Webhook processed");
    }
}
