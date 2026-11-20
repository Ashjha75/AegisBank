package com.banking.transactionservice.exception;

/**
 * The requested resource does not exist (HTTP 404).
 * <pre>{@code
 * Transaction transaction = transactionRepository.findById(transactionId)
 *         .orElseThrow(() -> new ResourceNotFoundException("Transaction", "id", transactionId));
 * }</pre>
 */
public class ResourceNotFoundException extends BusinessException {

    public ResourceNotFoundException(String resource, String field, Object value) {
        super(ErrorCode.RESOURCE_NOT_FOUND, resource + " not found with " + field + ": " + value);
    }
}
