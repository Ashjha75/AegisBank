package com.banking.accountservice.exception;

/**
 * Base class for every expected, business-rule failure in this service.
 * <p>
 * Throw a subclass (or this class with an {@link ErrorCode}) from the service layer;
 * {@link GlobalExceptionHandler} turns it into an HTTP error response with the code's status.
 * Unchecked, so service methods don't need {@code throws} clauses and
 * {@code @Transactional} rolls back automatically.
 */
public class BusinessException extends RuntimeException {

    private final ErrorCode errorCode;

    public BusinessException(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }
}
