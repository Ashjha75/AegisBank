package com.banking.transactionservice.exception;

/**
 * A transfer request breaks a basic rule (HTTP 400). Checked in the service as well as by Bean Validation
 * in the controller, because transfers can also arrive from Kafka, which bypasses controllers.
 */
public class InvalidTransferException extends BusinessException {

    public InvalidTransferException(String message) {
        super(ErrorCode.VALIDATION_FAILED, message);
    }
}
