package com.banking.transactionservice.exception;

import org.springframework.http.HttpStatus;

/**
 * Stable, machine-readable error codes sent to API clients in the {@code errorCode} field.
 * Clients branch on the code, never on the human-readable message.
 * Each code owns its HTTP status, so exceptions never hard-code statuses.
 * The generic codes match account-service, so clients see the same codes from every service.
 */
public enum ErrorCode {

    // Generic - same as account-service
    RESOURCE_NOT_FOUND(HttpStatus.NOT_FOUND, "Resource not found"),
    RESOURCE_ALREADY_EXISTS(HttpStatus.CONFLICT, "Resource already exists"),
    VALIDATION_FAILED(HttpStatus.BAD_REQUEST, "Validation failed"),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error"),

    // Transaction lifecycle
    INVALID_TRANSACTION_STATE(HttpStatus.CONFLICT, "Invalid transaction state"),
    INVALID_OTP(HttpStatus.UNPROCESSABLE_CONTENT, "Invalid OTP"),

    // Calls to other services (account-service, payment-service) during the SAGA
    DOWNSTREAM_SERVICE_ERROR(HttpStatus.BAD_GATEWAY, "Downstream service error");

    private final HttpStatus status;
    private final String title;

    ErrorCode(HttpStatus status, String title) {
        this.status = status;
        this.title = title;
    }

    public HttpStatus status() {
        return status;
    }

    public String title() {
        return title;
    }
}
