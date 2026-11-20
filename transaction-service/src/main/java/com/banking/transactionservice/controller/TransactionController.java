package com.banking.transactionservice.controller;

import com.banking.transactionservice.dto.HealthResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

/** Client-facing transaction APIs, routed by the api-gateway under /api/v1/transactions. */
@RestController
@RequestMapping("/api/v1/transactions")
public class TransactionController {

    private final String serviceName;

    public TransactionController(@Value("${spring.application.name}") String serviceName) {
        this.serviceName = serviceName;
    }

    /** Quick check that the service is up and reachable through the gateway / Swagger UI. */
    @GetMapping("/health")
    public ResponseEntity<HealthResponse> health() {
        return ResponseEntity.ok(new HealthResponse(serviceName, "UP", Instant.now()));
    }
}
