package com.banking.transactionservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/** Body of {@code POST /api/v1/transactions/{id}/verify-otp}. Sent in the body, not the URL, so it isn't logged by proxies. */
public record VerifyOtpRequest(

        @NotBlank(message = "OTP is required")
        @Pattern(regexp = "^\\d{6}$", message = "OTP must be 6 digits")
        String otp
) {
}
