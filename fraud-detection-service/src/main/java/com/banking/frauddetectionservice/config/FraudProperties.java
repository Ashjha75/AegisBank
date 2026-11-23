package com.banking.frauddetectionservice.config;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.math.BigDecimal;

/**
 * Fraud rules, bound from the {@code fraud.*} keys in application.yml (values come from .env,
 * e.g. FRAUD_MAX_TRANSACTIONS_PER_MINUTE=5), so they can change per environment without code changes.
 *
 * @param maxTransactionsPerMinute   velocity check: more transfers than this from one account within
 *                                   60 seconds is suspicious
 * @param suspiciousAmountMultiplier amount check: a transfer above (account's average transfer x this) is suspicious
 * @param maxBalancePercentage       balance check: a transfer above this share of the balance it was taken
 *                                   from is suspicious (0.90 = 90%)
 */
@Validated
@ConfigurationProperties(prefix = "fraud")
public record FraudProperties(
        @Min(1) int maxTransactionsPerMinute,
        @NotNull @DecimalMin(value = "1.0") BigDecimal suspiciousAmountMultiplier,
        @NotNull @DecimalMin(value = "0.0", inclusive = false) @DecimalMax("1.0") BigDecimal maxBalancePercentage
) {
}
