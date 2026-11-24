package com.banking.paymentservice.config;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * Razorpay credentials, bound from the {@code razorpay.*} keys in application.yml
 * (values come from RAZORPAY_* in payment-service/.env). Startup fails if one is missing.
 *
 * @param keyId         public key id (rzp_test_... / rzp_live_...) - safe to send to the frontend for Checkout
 * @param keySecret     API secret - server side only, never log or return it
 * @param webhookSecret secret set on the Razorpay webhook, used to verify X-Razorpay-Signature
 */
@Validated
@ConfigurationProperties(prefix = "razorpay")
public record RazorpayProperties(
        @NotBlank String keyId,
        @NotBlank String keySecret,
        @NotBlank String webhookSecret
) {
}
