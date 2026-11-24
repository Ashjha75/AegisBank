package com.banking.paymentservice.dto;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * Incoming payload to start a Razorpay payment into an AegisBank account (creates a Razorpay order).
 * A record (immutable, no Lombok), like the other services' DTOs.
 */
public record CreatePaymentRequest(

        @NotBlank(message = "Account number is required")
        @Pattern(regexp = "^[1-9]\\d{11}$", message = "Account number must be 12 digits")
        String accountNumber,

        @NotNull(message = "Amount is required")
        @Positive(message = "Amount must be greater than zero")
        @Digits(integer = 13, fraction = 2,
                message = "Amount can have at most 13 digits and 2 decimal places")
        BigDecimal amount,

        @Size(max = 255, message = "Description must be at most 255 characters")
        String description
) {
}
