package com.banking.paymentservice.service;

import com.banking.paymentservice.dto.CreatePaymentRequest;
import com.banking.paymentservice.dto.PaymentOrderResponse;
import com.banking.paymentservice.entity.Payment;
import com.banking.paymentservice.entity.PaymentStatus;
import com.banking.paymentservice.repository.PaymentRepository;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

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
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${razorpay.key.id}")
    private String keyId;
    @Value("${razorpay.key.secret}")
    private String keySecret;

    private static final String PAYMENT_COMPLETED_TOPIC = "payment.completed";
    private static final String PAYMENT_FAILED_TOPIC = "payment.failed";

    /**
     * Create Razorpay payment order
     * <pre>
     * Flow:
     * 1. Create order in Razorpay (with amount, currency, receipt id, etc.)
     * 2. Save the order id in our Payment entity (status CREATED)
     * 3. Return the order id to the frontend.
     * 4. Frontend will use the order id to open Razorpay checkout and complete the payment.
     * 5. Razorpay will call our webhook when the payment is completed or failed.
     * </pre>
     *
     * @param request
     * @return
     */

    public PaymentOrderResponse createPaymentOrder(CreatePaymentRequest request) throws RazorpayException {
        log.info("Creating payment order for account {} with amount {}", request.accountNumber(), request.amount());

        RazorpayClient razorPayClient = new RazorpayClient(keyId, keySecret);
        //Convert amount to paise (as Razorpay expects amount in the smallest currency unit)
        int convertedAmount = request.amount().
                multiply(java.math.BigDecimal.valueOf(100)).
                intValue();

        JSONObject orderRequest = new JSONObject();
        orderRequest.put("amount", convertedAmount);
        orderRequest.put("currency", "INR");
        orderRequest.put("receipt", "rcpt_" + System.currentTimeMillis() + UUID.randomUUID().toString().
                replace("-", "").substring(0, 10));

        Order razorpayOrder = razorPayClient.orders.create(orderRequest);

        log.info("Razorpay order created with id {}", razorpayOrder.get("id").toString());

//        Save Payment Record in Database with status CREATED
        Payment payment = Payment.builder()
                .razorpayOrderId(razorpayOrder.get("id").toString())
                .accountNumber(request.accountNumber())
                .amount(request.amount())
                .currency("INR")
                .status(PaymentStatus.CREATED)
                .description(request.description())
                .build();

        paymentRepository.save(payment);

        return new PaymentOrderResponse(
                payment.getId(),
                payment.getRazorpayOrderId(),
                payment.getAmount(),
                payment.getCurrency(),
                payment.getStatus(),
                keyId
        );
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
        log.info("Handling Razorpay webhook with payload: {} and signature: {}", payload, signature);

        if (PAYMENT_COMPLETED_TOPIC.equals(payload)) {
            handlePaymentCompleted(payload);
        } else if (PAYMENT_FAILED_TOPIC.equals(payload)) {
            handlePaymentFailed(payload);
        } else {
            log.warn("Received unknown webhook topic: {}", payload);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown webhook topic");
        }
    }

    private void handlePaymentFailed(String payload) {
    }

    private void handlePaymentCompleted(String payload) {
        try {
            Map<String, Object> paymentData = extractPaymentData(payload);
            String razorpayOrderId = (String) paymentData.get("razorpayOrderId");
            String razorpayPaymentId = (String) paymentData.get("razorpayPaymentId");

            Payment payment = paymentRepository.findByRazorpayOrderId(razorpayOrderId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found for order id: " + razorpayOrderId));
            payment.setRazorpayPaymentId(razorpayPaymentId);
            payment.setStatus(PaymentStatus.COMPLETED);
            paymentRepository.save(payment);

//            Publish completed Payment event

            Map<String, Object> eventPayload = new HashMap<>();
            eventPayload.put("paymentId", payment.getId());
            eventPayload.put("accountNumber", payment.getAccountNumber());
            eventPayload.put("amount", payment.getAmount());
            eventPayload.put("razorpayPaymentId", payment.getRazorpayPaymentId());

            kafkaTemplate.send(PAYMENT_COMPLETED_TOPIC, payment.getId(), eventPayload);
            log.info("Payment completed event published for payment id: {}", payment.getId());


        } catch (Exception e) {
            log.error("Error occurred while handling payment completed webhook", e);
        }
    }


}
