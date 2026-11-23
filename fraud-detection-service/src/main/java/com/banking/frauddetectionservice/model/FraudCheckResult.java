package com.banking.frauddetectionservice.model;

/**
 * Outcome of the fraud checks for one transaction.
 *
 * @param fraud  true when a check flagged the transaction
 * @param reason why it was flagged; null when clean
 */
public record FraudCheckResult(boolean fraud, String reason) {

    public static FraudCheckResult clean() {
        return new FraudCheckResult(false, null);
    }

    public static FraudCheckResult flagged(String reason) {
        return new FraudCheckResult(true, reason);
    }
}
