package com.banking.transactionservice.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * Incoming payload for a money transfer between two accounts.
 * A record (immutable, no Lombok), like the account-service DTOs.
 */
public record TransactionRequest(

        @NotBlank(message = "Sender account number is required")
        @Pattern(regexp = "^[1-9]\\d{11}$", message = "Sender account number must be 12 digits")
        String senderAccountNumber,

        @NotBlank(message = "Receiver account number is required")
        @Pattern(regexp = "^[1-9]\\d{11}$", message = "Receiver account number must be 12 digits")
        String receiverAccountNumber,

        // @Positive, not @PositiveOrZero: a transfer of 0 makes no sense
        @NotNull(message = "Amount is required")
        @Positive(message = "Amount must be greater than zero")
        @Digits(integer = 13, fraction = 2,
                message = "Amount can have at most 13 digits and 2 decimal places")
        BigDecimal amount,

        @Size(max = 255, message = "Description must be at most 255 characters")
        String description
) {

    /** Reported as field "differentAccounts" when validation fails. */
    @AssertTrue(message = "Sender and receiver accounts must be different")
    public boolean isDifferentAccounts() {
        return senderAccountNumber == null || !senderAccountNumber.equals(receiverAccountNumber);
    }
}
