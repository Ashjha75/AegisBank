package com.banking.transactionservice.exception;

import com.banking.transactionservice.dto.TransferRequest;
import com.banking.transactionservice.entity.TransactionStatus;
import jakarta.validation.Valid;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * transaction-service has no controller yet, so a small test-only controller throws each exception
 * and we check the JSON the client would receive.
 */
@WebMvcTest(controllers = GlobalExceptionHandlerTest.ProbeController.class)
@Import(GlobalExceptionHandlerTest.ProbeController.class)
class GlobalExceptionHandlerTest {

    @RestController
    static class ProbeController {

        @GetMapping("/probe/not-found/{id}")
        String notFound(@PathVariable String id) {
            throw new ResourceNotFoundException("Transaction", "id", id);
        }

        @GetMapping("/probe/invalid-state/{id}")
        String invalidState(@PathVariable String id) {
            throw new InvalidTransactionStateException(id, TransactionStatus.COMPLETED, "verify OTP");
        }

        @GetMapping("/probe/downstream")
        String downstream() {
            throw new DownstreamServiceException("account-service", "deduct balance",
                    new IOException("connect timed out to 10.0.0.12:8081"));
        }

        @GetMapping("/probe/unexpected")
        String unexpected() {
            throw new IllegalStateException("db password is hunter2");
        }

        @PostMapping("/probe/transfer")
        String transfer(@Valid @RequestBody TransferRequest request) {
            return "ok";
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Test
    void notFoundReturns404WithErrorCode() throws Exception {
        mockMvc.perform(get("/probe/not-found/tx-404"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").value("RESOURCE_NOT_FOUND"))
                .andExpect(jsonPath("$.detail").value("Transaction not found with id: tx-404"))
                .andExpect(jsonPath("$.instance").value("/probe/not-found/tx-404"))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    void invalidStateReturns409() throws Exception {
        mockMvc.perform(get("/probe/invalid-state/tx-1"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("INVALID_TRANSACTION_STATE"))
                .andExpect(jsonPath("$.detail").value("Cannot verify OTP transaction tx-1 in status COMPLETED"));
    }

    @Test
    void downstreamFailureReturns502WithoutLeakingInternals() throws Exception {
        mockMvc.perform(get("/probe/downstream"))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.errorCode").value("DOWNSTREAM_SERVICE_ERROR"))
                .andExpect(jsonPath("$.detail").value("Could not deduct balance: account-service is unavailable"))
                .andExpect(jsonPath("$.detail").value(not(containsString("10.0.0.12"))));
    }

    @Test
    void invalidTransferBodyReturns400WithEveryFieldError() throws Exception {
        String body = """
                {"senderAccountNumber":"363100275256","receiverAccountNumber":"363100275256","amount":0}
                """;

        mockMvc.perform(post("/probe/transfer").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.errors.amount").value("Amount must be greater than zero"))
                .andExpect(jsonPath("$.errors.differentAccounts").value("Sender and receiver accounts must be different"));
    }

    @Test
    void unexpectedErrorReturns500WithoutLeakingDetails() throws Exception {
        mockMvc.perform(get("/probe/unexpected"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.errorCode").value("INTERNAL_ERROR"))
                .andExpect(jsonPath("$.detail").value(not(containsString("hunter2"))));
    }
}
