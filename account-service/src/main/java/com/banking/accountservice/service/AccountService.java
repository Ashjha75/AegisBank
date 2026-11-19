package com.banking.accountservice.service;

import com.banking.accountservice.dto.AccountResponse;
import com.banking.accountservice.dto.CreateAccountRequest;
import jakarta.validation.Valid;

import java.math.BigDecimal;

public class AccountService {
    public AccountResponse createAccount(@Valid CreateAccountRequest createAccountRequest) {
    }

    public AccountResponse getAccount(String accountNumber) {
        return null;
    }

    public AccountResponse getAccountBalance(String accountNumber) {
    }

    public void blockAccount(String accountNumber) {
    }

    public void deductBalance(String accountNumber, BigDecimal amount) {
    }

    public void creditBalance(String accountNumber, BigDecimal amount) {
    }
}
