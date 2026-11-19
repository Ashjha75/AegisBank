package com.banking.accountservice.exception;

/**
 * The requested resource does not exist (HTTP 404).
 * <pre>{@code
 * Account account = accountRepository.findByAccountNumber(accountNumber)
 *         .orElseThrow(() -> new ResourceNotFoundException("Account", "accountNumber", accountNumber));
 * }</pre>
 */
public class ResourceNotFoundException extends BusinessException {

    public ResourceNotFoundException(String resource, String field, Object value) {
        super(ErrorCode.RESOURCE_NOT_FOUND, resource + " not found with " + field + ": " + value);
    }
}
