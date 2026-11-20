package com.banking.transactionservice.dto;

import java.time.Instant;

/** Simple liveness answer from {@code GET /api/v1/transactions/health}. */
public record HealthResponse(String service, String status, Instant timestamp) {
}
