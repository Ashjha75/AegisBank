package com.banking.paymentservice.service;

import com.banking.paymentservice.config.RazorpayProperties;
import com.banking.paymentservice.dto.CreatePaymentRequest;
import com.banking.paymentservice.dto.PaymentOrderResponse;
import com.banking.paymentservice.entity.Payment;
import com.banking.paymentservice.entity.PaymentStatus;
import com.banking.paymentservice.repository.PaymentRepository;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONException;
import org.json.JSONObject;
import org.springframework.http.HttpStatus;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.Map;

/**
 * Razorpay payments into AegisBank accounts.
 * <pre>
 *  createPaymentOrder: Razorpay order  -> Payment CREATED      -> frontend opens Razorpay Checkout
 *  handleWebhook:      payment.captured -> Payment COMPLETED   -> Kafka payment.completed
 *                      payment.failed   -> Payment FAILED      -> Kafka payment.failed
 * </pre>
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class PaymentService {

    /** Kafka topics this service publishes to. */
    private static final String PAYMENT_COMPLETED_TOPIC = "payment.completed";
    private static final String PAYMENT_FAILED_TOPIC = "payment.failed";

    /** Razorpay webhook event names (the "event" field of the webhook body) - not Kafka topics. */
    private static final String EVENT_PAYMENT_CAPTURED = "payment.captured";
    private static final String EVENT_PAYMENT_FAILED = "payment.failed";

    private static final String CURRENCY = "INR";

    private final PaymentRepository paymentRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    /** Shared client from RazorpayConfig - never create one per request. */
    private final RazorpayClient razorpayClient;
    /** keyId() goes to the frontend for Checkout; webhookSecret() verifies webhooks. */
    private final RazorpayProperties razorpayProperties;

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
     * @param request account to pay into, amount in rupees, optional description
     * @return order details for Razorpay Checkout (includes the PUBLIC key id only)
     * @throws ResponseStatusException 502 if Razorpay rejects the order or can't be reached
     */
    @Transactional
    public PaymentOrderResponse createPaymentOrder(CreatePaymentRequest request) {
        log.info("Creating payment order for account {} with amount {}", request.accountNumber(), request.amount());

        // Razorpay expects the amount in paise (smallest currency unit): Rs 500.25 -> 50025.
        JSONObject orderRequest = new JSONObject();
        orderRequest.put("amount", toPaise(request.amount()));
        orderRequest.put("currency", CURRENCY);
        // Receipt: our own reference shown in the Razorpay dashboard (max 40 chars).
        orderRequest.put("receipt", "rcpt_" + System.currentTimeMillis());

        Order razorpayOrder;
        try {
            razorpayOrder = razorpayClient.orders.create(orderRequest);
        } catch (RazorpayException e) {
            log.error("Razorpay order creation failed for account {}", request.accountNumber(), e);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Could not create Razorpay order", e);
        }
        String razorpayOrderId = razorpayOrder.get("id");
        log.info("Razorpay order created with id {}", razorpayOrderId);

        // Save Payment record in database with status CREATED
        Payment payment = paymentRepository.save(Payment.builder()
                .razorpayOrderId(razorpayOrderId)
                .accountNumber(request.accountNumber())
                .amount(request.amount())
                .currency(CURRENCY)
                .status(PaymentStatus.CREATED)
                .description(request.description())
                .build());

        return new PaymentOrderResponse(
                payment.getId(),
                payment.getRazorpayOrderId(),
                payment.getAmount(),
                payment.getCurrency(),
                payment.getStatus(),
                razorpayProperties.keyId());
    }

    /**
     * Handles a Razorpay webhook.
     * <pre>
     * 1. Verify X-Razorpay-Signature (HMAC-SHA256 of the raw body with the webhook secret).
     *    Without this anyone could POST a fake "payment.captured" and get money credited.
     * 2. Dispatch on the "event" field: payment.captured / payment.failed. Other events are ignored
     *    (answering 200), otherwise Razorpay keeps retrying them and may disable the webhook.
     * </pre>
     * Errors are NOT swallowed: a non-2xx answer makes Razorpay retry the webhook later.
     *
     * @param payload   raw request body, exactly as Razorpay sent it (needed for the signature check)
     * @param signature value of the X-Razorpay-Signature header
     */
    @Transactional
    public void handleWebhook(String payload, String signature) {
        verifySignature(payload, signature);

        JSONObject webhook;
        String event;
        JSONObject paymentEntity;
        try {
            webhook = new JSONObject(payload);
            event = webhook.getString("event");
            if (!EVENT_PAYMENT_CAPTURED.equals(event) && !EVENT_PAYMENT_FAILED.equals(event)) {
                log.info("Ignoring Razorpay webhook event {}", event);
                return;
            }
            paymentEntity = webhook.getJSONObject("payload").getJSONObject("payment").getJSONObject("entity");
        } catch (JSONException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Malformed Razorpay webhook body", e);
        }
        log.info("Handling Razorpay webhook event {}", event);

        if (EVENT_PAYMENT_CAPTURED.equals(event)) {
            handlePaymentCompleted(paymentEntity);
        } else {
            handlePaymentFailed(paymentEntity);
        }
    }

    /** payment.captured: the customer paid - mark COMPLETED and publish payment.completed. */
    private void handlePaymentCompleted(JSONObject paymentEntity) {
        Payment payment = lockPayment(paymentEntity.getString("order_id"));
        // Razorpay may deliver the same webhook more than once - don't complete (and credit) twice.
        if (payment.getStatus() == PaymentStatus.COMPLETED) {
            log.info("Payment {} already COMPLETED - duplicate webhook ignored", payment.getId());
            return;
        }

        // The captured amount must be what we created the order for.
        long paidPaise = paymentEntity.getLong("amount");
        if (paidPaise != toPaise(payment.getAmount())) {
            log.error("Payment {}: captured {} paise but order was for {} paise",
                    payment.getId(), paidPaise, toPaise(payment.getAmount()));
            markFailed(payment, "Captured amount does not match the order amount");
            return;
        }

        payment.setRazorpayPaymentId(paymentEntity.getString("id"));
        payment.setStatus(PaymentStatus.COMPLETED);
        paymentRepository.save(payment);

        // Publish completed Payment event
        Map<String, Object> eventPayload = new HashMap<>();
        eventPayload.put("paymentId", payment.getId());
        eventPayload.put("accountNumber", payment.getAccountNumber());
        eventPayload.put("amount", payment.getAmount());
        eventPayload.put("razorpayPaymentId", payment.getRazorpayPaymentId());
        // join(): if Kafka fails, the exception rolls back the status change and Razorpay retries the webhook.
        kafkaTemplate.send(PAYMENT_COMPLETED_TOPIC, payment.getId(), eventPayload).join();
        log.info("Payment completed event published for payment id: {}", payment.getId());
    }

    /** payment.failed: the attempt failed - mark FAILED and publish payment.failed. */
    private void handlePaymentFailed(JSONObject paymentEntity) {
        Payment payment = lockPayment(paymentEntity.getString("order_id"));
        // A failed retry must not undo a payment that already succeeded (or was already marked failed).
        if (payment.getStatus() != PaymentStatus.CREATED && payment.getStatus() != PaymentStatus.PENDING) {
            log.info("Payment {} is {} - payment.failed webhook ignored", payment.getId(), payment.getStatus());
            return;
        }
        payment.setRazorpayPaymentId(paymentEntity.optString("id", null));
        String reason = paymentEntity.optString("error_description", "");
        markFailed(payment, reason.isBlank() ? "Payment failed via Razorpay webhook" : reason);
    }

    private void markFailed(Payment payment, String reason) {
        payment.setStatus(PaymentStatus.FAILED);
        payment.setFailureReason(reason);
        paymentRepository.save(payment);

        // Publish failed Payment event
        Map<String, Object> eventPayload = new HashMap<>();
        eventPayload.put("paymentId", payment.getId());
        eventPayload.put("accountNumber", payment.getAccountNumber());
        eventPayload.put("amount", payment.getAmount());
        eventPayload.put("reason", reason);
        kafkaTemplate.send(PAYMENT_FAILED_TOPIC, payment.getId(), eventPayload).join();
        log.info("Payment failed event published for payment id: {}", payment.getId());
    }

    // ---------------------------------------------------------------- helpers

    /** Loads the payment with a row lock, so two parallel webhook deliveries are handled one after the other. */
    private Payment lockPayment(String razorpayOrderId) {
        return paymentRepository.findByRazorpayOrderIdForUpdate(razorpayOrderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Payment not found for order id: " + razorpayOrderId));
    }

    private void verifySignature(String payload, String signature) {
        boolean valid;
        try {
            valid = Utils.verifyWebhookSignature(payload, signature, razorpayProperties.webhookSecret());
        } catch (RazorpayException e) {
            valid = false;
        }
        if (!valid) {
            log.warn("Rejected Razorpay webhook with invalid signature");
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid webhook signature");
        }
    }

    /** Rupees -> paise. long + exact: no silent overflow (int tops out near Rs 2.1 crore) or truncation. */
    static long toPaise(BigDecimal rupees) {
        return rupees.setScale(2, RoundingMode.UNNECESSARY).movePointRight(2).longValueExact();
    }
}
