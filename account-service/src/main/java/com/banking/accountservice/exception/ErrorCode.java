package com.banking.accountservice.exception;

import org.springframework.http.HttpStatus;

/**
 * Stable, machine-readable error codes sent to API clients in the {@code errorCode} field.
 * Clients branch on the code, never on the human-readable message.
 * Each code owns its HTTP status, so exceptions never hard-code statuses.
 */
public enum ErrorCode {

    // Generic - reusable for any resource (account, transaction, ...)
    RESOURCE_NOT_FOUND(HttpStatus.NOT_FOUND, "Resource not found"),
    RESOURCE_ALREADY_EXISTS(HttpStatus.CONFLICT, "Resource already exists"),
    VALIDATION_FAILED(HttpStatus.BAD_REQUEST, "Validation failed"),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error"),

    // Account / money movement
    ACCOUNT_NOT_ACTIVE(HttpStatus.UNPROCESSABLE_CONTENT, "Account is not active"),
    INSUFFICIENT_BALANCE(HttpStatus.UNPROCESSABLE_CONTENT, "Insufficient balance");

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
