package com.banking.transactionservice.entity;

/**
 * Transaction  Lifecycle flow: </br>
 *   PENDING -> PROCESSING -> COMPLETED  (clean transaction case)</br>
 *                         -> PENDING_VERIFICATION (suspicious detected  case) </br>
 *                                      -> COMPLETED (verified case) </br>
 *                                      -> FLAGGED (SAGA Refund case) </br>
 *                         -> FAILED </br>
 *                         ->FLAGGED </br>
 */
public enum TransactionStatus {
    PENDING,
    PROCESSING,
    COMPLETED,
    PENDING_VERIFICATION,
    FAILED,
    FLAGGED
}
