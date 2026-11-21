package com.banking.transactionservice.controller;

import com.banking.transactionservice.dto.HealthResponse;
import com.banking.transactionservice.dto.TransactionResponse;
import com.banking.transactionservice.dto.TransferRequest;
import com.banking.transactionservice.dto.VerifyOtpRequest;
import com.banking.transactionservice.service.TransactionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

/** Client-facing transaction APIs, routed by the api-gateway under /api/v1/transactions. */
@RestController
@RequestMapping("/api/v1/transactions")
@Tag(name = "Transactions", description = "Money transfers between accounts")
@Slf4j
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    @Value("${spring.application.name}")
    private String serviceName;

    @Operation(summary = "Health check", description = "Quick check that the service is up and reachable through the gateway.")
    @GetMapping("/health")
    public ResponseEntity<HealthResponse> health() {
        return ResponseEntity.ok(new HealthResponse(serviceName, "UP", Instant.now()));
    }

    @Operation(summary = "Transfer money",
            description = "Deducts the sender and credits the receiver. Returns the transaction with status "
                    + "COMPLETED, PENDING_VERIFICATION (amount over the OTP threshold - call verify-otp) "
                    + "or FAILED (see failureReason, e.g. insufficient balance).")
    @PostMapping("/transfer")
    public ResponseEntity<TransactionResponse> transfer(@Valid @RequestBody TransferRequest transferRequest) {
        log.info("Transfer requested: {} -> {}, amount {}", transferRequest.senderAccountNumber(),
                transferRequest.receiverAccountNumber(), transferRequest.amount());
        return ResponseEntity.status(HttpStatus.CREATED).body(transactionService.transfer(transferRequest));
    }

    @Operation(summary = "Get a transaction by id")
    @GetMapping("/{transactionId}")
    public ResponseEntity<TransactionResponse> getTransaction(@PathVariable String transactionId) {
        return ResponseEntity.ok(transactionService.getTransaction(transactionId));
    }

    @Operation(summary = "Transaction history of an account", description = "Sent and received transactions, newest first.")
    @GetMapping("/account/{accountNumber}/history")
    public ResponseEntity<List<TransactionResponse>> getTransactionHistory(@PathVariable String accountNumber) {
        return ResponseEntity.ok(transactionService.getTransactionHistory(accountNumber));
    }

    @Operation(summary = "Verify OTP of a high-value transfer",
            description = "Right OTP: receiver is credited (COMPLETED). Wrong OTP: 422 with attempts left. "
                    + "Expired or too many wrong attempts: sender is refunded and the transfer is FLAGGED.")
    @PostMapping("/{transactionId}/verify-otp")
    public ResponseEntity<TransactionResponse> verifyOTP(@PathVariable String transactionId,
                                                         @Valid @RequestBody VerifyOtpRequest request) {
        // Never log the OTP itself.
        log.info("Verify OTP requested for transaction: {}", transactionId);
        return ResponseEntity.ok(transactionService.verifyOTP(transactionId, request.otp()));
    }
}
