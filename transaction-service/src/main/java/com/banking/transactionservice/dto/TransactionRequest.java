package com.banking.transactionservice.dto;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TransactionRequest {
    @NotBlank(message = "Sender account number is required ")
    private String senderAccountNumber;
    @NotBlank(message = "Receiver account number is required ")
    private String receiverAccountNumber;

    @NotNull(message = "Amount is required")
    @PositiveOrZero(message = "Amount cannot be negative")
    @Digits(integer = 13, fraction = 2,
            message = "Amount can have at most 13 digits and 2 decimal places")
    private BigDecimal amount;

    private String description;
}
