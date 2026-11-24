package com.banking.paymentservice.controller;

import com.banking.paymentservice.dto.PaymentOrderResponse;
import com.banking.paymentservice.entity.PaymentStatus;
import com.banking.paymentservice.service.PaymentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PaymentController.class)
class PaymentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private PaymentService paymentService;

    @Test
    void createOrderReturns201() throws Exception {
        given(paymentService.createPaymentOrder(any())).willReturn(new PaymentOrderResponse(
                "pay-1", "order_123", new BigDecimal("500.00"), "INR", PaymentStatus.CREATED, "rzp_test_key"));

        mockMvc.perform(post("/api/v1/payments/create-order").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"accountNumber":"123456789012","amount":500,"description":"Add money"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.razorpayOrderId").value("order_123"))
                .andExpect(jsonPath("$.status").value("CREATED"))
                .andExpect(jsonPath("$.razorpayKeyId").value("rzp_test_key"));
    }

    @Test
    void invalidCreateOrderIsRejectedBeforeTheService() throws Exception {
        mockMvc.perform(post("/api/v1/payments/create-order").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"accountNumber":"123","amount":0}
                                """))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(paymentService);
    }

    @Test
    void webhookPassesRawBodyAndSignature() throws Exception {
        String body = "{\"event\":\"payment.captured\"}";

        mockMvc.perform(post("/api/v1/payments/webhook").contentType(MediaType.APPLICATION_JSON)
                        .header("X-Razorpay-Signature", "sig-123")
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(content().string("Webhook processed"));
        verify(paymentService).handleWebhook(body, "sig-123");
    }

    @Test
    void webhookWithoutSignatureIsRejected() throws Exception {
        mockMvc.perform(post("/api/v1/payments/webhook").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(paymentService);
    }
}
