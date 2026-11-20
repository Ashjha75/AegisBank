package com.banking.transactionservice.exception;

/**
 * A unique value is already taken (HTTP 409).
 * <pre>{@code
 * throw new ResourceAlreadyExistsException("Transaction", "referenceNumber", referenceNumber);
 * // -> "Transaction already exists with referenceNumber: TXN20261120ABC123"
 * }</pre>
 */
public class ResourceAlreadyExistsException extends BusinessException {

    public ResourceAlreadyExistsException(String resource, String field, Object value) {
        super(ErrorCode.RESOURCE_ALREADY_EXISTS, resource + " already exists with " + field + ": " + value);
    }
}
