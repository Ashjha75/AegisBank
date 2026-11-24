package com.banking.paymentservice.service;

import com.banking.paymentservice.config.RazorpayProperties;
import com.banking.paymentservice.dto.CreatePaymentRequest;
import com.banking.paymentservice.dto.PaymentOrderResponse;
import com.banking.paymentservice.entity.Payment;
import com.banking.paymentservice.entity.PaymentStatus;
import com.banking.paymentservice.repository.PaymentRepository;
import com.razorpay.Order;
import com.razorpay.OrderClient;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import org.json.JSONObject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpStatus;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/** Plain unit test - Razorpay, the database and Kafka are mocked. */
class PaymentServiceTest {

    private static final String WEBHOOK_SECRET = "test-webhook-secret";
    private static final String ACCOUNT = "363100275256";

    private PaymentRepository repository;
    private KafkaTemplate<String, Object> kafkaTemplate;
    private OrderClient orders;
    private PaymentService service;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        repository = mock(PaymentRepository.class);
        kafkaTemplate = mock(KafkaTemplate.class);
        RazorpayClient razorpayClient = mock(RazorpayClient.class);
        orders = mock(OrderClient.class);
        razorpayClient.orders = orders;
        when(repository.save(any(Payment.class))).thenAnswer(inv -> inv.getArgument(0));
        when(kafkaTemplate.send(anyString(), any(), any())).thenReturn(CompletableFuture.completedFuture(null));
        service = new PaymentService(repository, kafkaTemplate, razorpayClient,
                new RazorpayProperties("rzp_test_key", "key-secret", WEBHOOK_SECRET));
    }

    // ------------------------------------------------------------- createPaymentOrder

    @Test
    void createOrderSendsPaiseAndSavesCreatedPayment() throws Exception {
        when(orders.create(any())).thenReturn(new Order(new JSONObject().put("id", "order_123")));

        PaymentOrderResponse response = service.createPaymentOrder(
                new CreatePaymentRequest(ACCOUNT, new BigDecimal("500.25"), "Add money"));

        ArgumentCaptor<JSONObject> orderRequest = ArgumentCaptor.forClass(JSONObject.class);
        verify(orders).create(orderRequest.capture());
        assertThat(orderRequest.getValue().getLong("amount")).isEqualTo(50025L);
        assertThat(orderRequest.getValue().getString("currency")).isEqualTo("INR");

        assertThat(response.razorpayOrderId()).isEqualTo("order_123");
        assertThat(response.status()).isEqualTo(PaymentStatus.CREATED);
        assertThat(response.razorpayKeyId()).isEqualTo("rzp_test_key");
    }

    @Test
    void razorpayErrorBecomes502AndNothingIsSaved() throws Exception {
        when(orders.create(any())).thenThrow(new RazorpayException("BAD_REQUEST_ERROR"));

        assertThatThrownBy(() -> service.createPaymentOrder(new CreatePaymentRequest(ACCOUNT, BigDecimal.TEN, null)))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        e -> assertThat(e.getStatusCode()).isEqualTo(HttpStatus.BAD_GATEWAY));
        verify(repository, never()).save(any());
    }

    @Test
    void largeAmountsDoNotOverflow() {
        // 30 crore rupees = 3,000,000,000 paise - more than an int can hold
        assertThat(PaymentService.toPaise(new BigDecimal("30000000.00"))).isEqualTo(3_000_000_000L);
    }

    // ------------------------------------------------------------- handleWebhook

    @Test
    @SuppressWarnings("unchecked")
    void capturedWebhookCompletesPaymentAndPublishesEvent() {
        Payment payment = created(new BigDecimal("500.00"));
        String body = webhook("payment.captured", 50000);

        service.handleWebhook(body, sign(body));

        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.COMPLETED);
        assertThat(payment.getRazorpayPaymentId()).isEqualTo("pay_1");
        ArgumentCaptor<Object> event = ArgumentCaptor.forClass(Object.class);
        verify(kafkaTemplate).send(eq("payment.completed"), eq("p-1"), event.capture());
        assertThat((Map<String, Object>) event.getValue()).containsEntry("accountNumber", ACCOUNT);
    }

    @Test
    void invalidSignatureIsRejectedWithoutTouchingPayments() {
        String body = webhook("payment.captured", 50000);

        assertThatThrownBy(() -> service.handleWebhook(body, "forged"))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        e -> assertThat(e.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));
        verifyNoInteractions(kafkaTemplate);
        verify(repository, never()).findByRazorpayOrderIdForUpdate(anyString());
    }

    @Test
    void duplicateCapturedWebhookIsIgnored() {
        Payment payment = created(new BigDecimal("500.00"));
        payment.setStatus(PaymentStatus.COMPLETED);
        String body = webhook("payment.captured", 50000);

        service.handleWebhook(body, sign(body));

        verifyNoInteractions(kafkaTemplate);
    }

    @Test
    void capturedAmountMismatchFailsThePayment() {
        Payment payment = created(new BigDecimal("500.00"));
        String body = webhook("payment.captured", 100);

        service.handleWebhook(body, sign(body));

        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.FAILED);
        verify(kafkaTemplate).send(eq("payment.failed"), eq("p-1"), any());
        verify(kafkaTemplate, never()).send(eq("payment.completed"), any(), any());
    }

    @Test
    void failedWebhookMarksPaymentFailedWithRazorpayReason() {
        Payment payment = created(new BigDecimal("500.00"));
        String body = webhook("payment.failed", 50000);

        service.handleWebhook(body, sign(body));

        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.FAILED);
        assertThat(payment.getFailureReason()).isEqualTo("Card declined");
        verify(kafkaTemplate).send(eq("payment.failed"), eq("p-1"), any());
    }

    @Test
    void failedWebhookDoesNotUndoACompletedPayment() {
        Payment payment = created(new BigDecimal("500.00"));
        payment.setStatus(PaymentStatus.COMPLETED);
        String body = webhook("payment.failed", 50000);

        service.handleWebhook(body, sign(body));

        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.COMPLETED);
        verifyNoInteractions(kafkaTemplate);
    }

    @Test
    void otherEventsAreIgnored() {
        String body = new JSONObject().put("event", "order.paid").toString();

        service.handleWebhook(body, sign(body));

        verifyNoInteractions(kafkaTemplate);
        verify(repository, never()).findByRazorpayOrderIdForUpdate(anyString());
    }

    @Test
    void unknownOrderIs404() {
        when(repository.findByRazorpayOrderIdForUpdate("order_1")).thenReturn(Optional.empty());
        String body = webhook("payment.captured", 50000);

        assertThatThrownBy(() -> service.handleWebhook(body, sign(body)))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        e -> assertThat(e.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));
    }

    // ------------------------------------------------------------- helpers

    private Payment created(BigDecimal amount) {
        Payment payment = Payment.builder().id("p-1").razorpayOrderId("order_1").accountNumber(ACCOUNT)
                .amount(amount).status(PaymentStatus.CREATED).build();
        when(repository.findByRazorpayOrderIdForUpdate("order_1")).thenReturn(Optional.of(payment));
        return payment;
    }

    /** Same shape as a real Razorpay webhook body. */
    private static String webhook(String event, long amountPaise) {
        JSONObject entity = new JSONObject().put("id", "pay_1").put("order_id", "order_1")
                .put("amount", amountPaise).put("currency", "INR")
                .put("error_description", "payment.failed".equals(event) ? "Card declined" : JSONObject.NULL);
        return new JSONObject().put("event", event)
                .put("payload", new JSONObject().put("payment", new JSONObject().put("entity", entity)))
                .toString();
    }

    /** What Razorpay puts in X-Razorpay-Signature: hex HMAC-SHA256 of the body with the webhook secret. */
    private static String sign(String body) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(WEBHOOK_SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(body.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
