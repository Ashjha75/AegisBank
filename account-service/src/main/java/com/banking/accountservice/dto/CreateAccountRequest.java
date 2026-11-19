package com.banking.accountservice.dto;

import com.banking.accountservice.entity.AccountType;
import com.banking.accountservice.validation.MinimumInitialDeposit;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * Incoming payload for opening a new account.
 * <p>
 * A record: immutable, no Lombok needed, and Jackson + Bean Validation both support it.
 * {@link MinimumInitialDeposit} checks the deposit against the configured minimum
 * balance for the chosen {@link AccountType} (see {@code account.minimum-balance} in application.yml).
 */
@MinimumInitialDeposit
public record CreateAccountRequest(

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        String email,

        @NotBlank(message = "Phone number is required")
        @Pattern(regexp = "^(\\+91)?[6-9]\\d{9}$",
                message = "Phone number must be a valid 10-digit Indian mobile number")
        String phone,

        @NotNull(message = "Account type is required")
        AccountType accountType,

        @NotBlank(message = "Account holder name is required")
        @Size(max = 100, message = "Account holder name must be at most 100 characters")
        String accountHolderName,

        // @NotBlank only works on text, so BigDecimal needs @NotNull.
        // PositiveOrZero (not Positive) because zero-balance accounts are valid when the minimum is 0;
        // the per-account-type minimum is enforced by @MinimumInitialDeposit on the class.
        @NotNull(message = "Initial deposit is required")
        @PositiveOrZero(message = "Initial deposit cannot be negative")
        @Digits(integer = 13, fraction = 2,
                message = "Initial deposit can have at most 13 digits and 2 decimal places")
        BigDecimal initialDeposit
) {
}
