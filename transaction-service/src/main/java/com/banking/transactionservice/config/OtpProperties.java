package com.banking.transactionservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.math.BigDecimal;

/**
 * OTP rules for high-value transfers, from transaction-service/.env (see application.yml "transaction.otp").
 *
 * @param threshold     transfers of this amount or more need an OTP before the receiver is credited
 * @param expiryMinutes how long an OTP stays valid
 * @param maxAttempts   wrong OTPs allowed before the transfer is FLAGGED and the sender refunded
 */
@ConfigurationProperties(prefix = "transaction.otp")
public record OtpProperties(BigDecimal threshold, int expiryMinutes, int maxAttempts) {
}
