package com.banking.transactionservice.controller;

import com.banking.transactionservice.dto.HealthResponse;
import com.banking.transactionservice.dto.TransactionResponse;
import com.banking.transactionservice.dto.TransferRequest;
import com.banking.transactionservice.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

/** Client-facing transaction APIs, routed by the api-gateway under /api/v1/transactions. */
@RestController
@RequestMapping("/api/v1/transactions")
@Slf4j
@RequiredArgsConstructor
public class TransactionController {
    private final TransactionService transactionService;

    /** Quick check that the service is up and reachable through the gateway / Swagger UI. */
    @GetMapping("/health")
    public ResponseEntity<HealthResponse> health() {
        log.info("Health check requested");
        return ResponseEntity.ok(new HealthResponse(transactionService.toString(), "UP", Instant.now()));
    }

    @PostMapping("/transfer")
    public ResponseEntity<TransactionResponse> transfer(@Valid @RequestBody TransferRequest transferRequest) {
        log.info("Transfer requested: {}", transferRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(transactionService.transfer(transferRequest));
    }

    @GetMapping("/{transactionId}")
    public ResponseEntity<TransactionResponse> getTransaction(@PathVariable String transactionId) {
        log.info("Get transaction requested: {}", transactionId);
        return ResponseEntity.ok(transactionService.getTransaction(transactionId));
    }
}
