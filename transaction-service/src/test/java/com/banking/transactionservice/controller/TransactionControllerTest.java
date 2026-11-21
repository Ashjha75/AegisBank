package com.banking.transactionservice.controller;

import com.banking.transactionservice.dto.TransactionResponse;
import com.banking.transactionservice.entity.TransactionStatus;
import com.banking.transactionservice.entity.TransactionType;
import com.banking.transactionservice.service.TransactionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TransactionController.class)
class TransactionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TransactionService transactionService;

    private static TransactionResponse response(TransactionStatus status) {
        return new TransactionResponse("tx-1", "123456789012", "223456789012", new BigDecimal("500.00"),
                TransactionType.TRANSFER, status, null, null, "TXN1", LocalDateTime.now(), null);
    }

    @Test
    void healthReturnsUp() throws Exception {
        mockMvc.perform(get("/api/v1/transactions/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.service").value("transaction-service"))
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    void transferReturns201() throws Exception {
        given(transactionService.transfer(any())).willReturn(response(TransactionStatus.COMPLETED));

        mockMvc.perform(post("/api/v1/transactions/transfer").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"senderAccountNumber":"123456789012","receiverAccountNumber":"223456789012","amount":500}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("COMPLETED"));
    }

    @Test
    void invalidTransferIsRejectedBeforeTheService() throws Exception {
        mockMvc.perform(post("/api/v1/transactions/transfer").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"senderAccountNumber":"123","receiverAccountNumber":"223456789012","amount":-5}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_FAILED"));
        verifyNoInteractions(transactionService);
    }

    @Test
    void verifyOtpReadsOtpFromBody() throws Exception {
        given(transactionService.verifyOTP(eq("tx-1"), eq("123456"))).willReturn(response(TransactionStatus.COMPLETED));

        mockMvc.perform(post("/api/v1/transactions/tx-1/verify-otp").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"otp\":\"123456\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));
    }

    @Test
    void verifyOtpRejectsNonSixDigitOtp() throws Exception {
        mockMvc.perform(post("/api/v1/transactions/tx-1/verify-otp").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"otp\":\"12ab\"}"))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(transactionService);
    }
}
