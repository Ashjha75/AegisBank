package com.banking.transactionservice.exception;

import com.banking.transactionservice.entity.TransactionStatus;

/**
 * The requested action is not allowed in the transaction's current status (HTTP 409),
 * e.g. verifying an OTP for a transaction that is already COMPLETED.
 * <pre>{@code
 * if (transaction.getStatus() != TransactionStatus.PENDING_VERIFICATION) {
 *     throw new InvalidTransactionStateException(transaction.getId(), transaction.getStatus(), "verify OTP");
 * }
 * }</pre>
 */
public class InvalidTransactionStateException extends BusinessException {

    public InvalidTransactionStateException(String transactionId, TransactionStatus currentStatus, String action) {
        super(ErrorCode.INVALID_TRANSACTION_STATE,
                "Cannot " + action + " transaction " + transactionId + " in status " + currentStatus);
    }
}
