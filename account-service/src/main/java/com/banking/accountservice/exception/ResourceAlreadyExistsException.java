package com.banking.accountservice.exception;

/**
 * A unique value is already taken (HTTP 409).
 * <pre>{@code
 * throw new ResourceAlreadyExistsException("Account", "email", request.email());
 * // -> "Account already exists with email: asha@example.com"
 * }</pre>
 */
public class ResourceAlreadyExistsException extends BusinessException {

    public ResourceAlreadyExistsException(String resource, String field, Object value) {
        super(ErrorCode.RESOURCE_ALREADY_EXISTS, resource + " already exists with " + field + ": " + value);
    }
}
