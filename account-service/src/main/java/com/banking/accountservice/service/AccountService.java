package com.banking.accountservice.service;

import com.banking.accountservice.dto.AccountResponse;
import com.banking.accountservice.dto.CreateAccountRequest;
import com.banking.accountservice.exception.ResourceAlreadyExistsException;
import com.banking.accountservice.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@Slf4j
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;

    public AccountResponse createAccount( CreateAccountRequest createAccountRequest) {
        log.info("Create Account Request for:  {}",createAccountRequest.email());
        if (accountRepository.existsByEmail(createAccountRequest.email())) {
            throw new ResourceAlreadyExistsException("Account", "email", createAccountRequest.email());
        }
        if (accountRepository.existsByPhone(createAccountRequest.phone())) {
            throw new ResourceAlreadyExistsException("Account", "phone", createAccountRequest.phone());
        }
        return null;
    }

    public AccountResponse getAccount(String accountNumber) {
        return null;
    }

    public AccountResponse getAccountBalance(String accountNumber) {
        return null;
    }

    public void blockAccount(String accountNumber) {
    }

    public void deductBalance(String accountNumber, BigDecimal amount) {
    }

    public void creditBalance(String accountNumber, BigDecimal amount) {
    }
}
