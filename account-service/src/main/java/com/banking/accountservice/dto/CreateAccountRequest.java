package com.banking.accountservice.dto;

import com.banking.accountservice.entity.AccountStatus;
import com.banking.accountservice.entity.AccountType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateAccountRequest {
    @NotBlank(message="Email is required")
    @Email(message = "Invalid Email Format")
    private  String email;

    @NotBlank(message = "Phone Number is required")
    private String phone;

    @NotBlank(message = "Account Type is required")
    private AccountType accountType;

    @NotBlank(message = "Account Holder Name is required")
    private  String AccountHolderName;

    @NotBlank(message = "Initial Deposit is Required")
    private BigDecimal initialDeposit;
}
