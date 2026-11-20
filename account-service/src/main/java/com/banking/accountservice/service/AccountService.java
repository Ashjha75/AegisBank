package com.banking.accountservice.service;

import com.banking.accountservice.dto.AccountResponse;
import com.banking.accountservice.dto.CreateAccountRequest;
import com.banking.accountservice.entity.Account;
import com.banking.accountservice.entity.AccountStatus;
import com.banking.accountservice.entity.AccountType;
import com.banking.accountservice.exception.ResourceAlreadyExistsException;
import com.banking.accountservice.exception.ResourceNotFoundException;
import com.banking.accountservice.mapper.AccountMapper;
import com.banking.accountservice.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@Slf4j
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;
    private final AccountMapper accountMapper;
    private final AccountNumberGenerator accountNumberGenerator;

    @Transactional
    public AccountResponse createAccount( CreateAccountRequest createAccountRequest) {
        log.info("Create Account Request for:  {}",createAccountRequest.email());
        if (accountRepository.existsByEmail(createAccountRequest.email())) {
            throw new ResourceAlreadyExistsException("Account", "email", createAccountRequest.email());
        }
        if (accountRepository.existsByPhone(createAccountRequest.phone())) {
            throw new ResourceAlreadyExistsException("Account","phone",createAccountRequest.phone());
        }

        // Mapper copies the request data; business fields are decided here in the service.
        Account account = accountMapper.toEntity(createAccountRequest);
        account.setAccountNumber(accountNumberGenerator.generate());
        account.setAccountStatus(AccountStatus.ACTIVE);
        account.setDailyTransactionLimit(createAccountRequest.accountType() == AccountType.SAVINGS
                ? new BigDecimal("100000")
                : new BigDecimal("500000"));

        // saveAndFlush (not save): writes the row now, so @CreationTimestamp fills createdAt before we map the response
        Account savedAccount = accountRepository.saveAndFlush(account);
        log.info("Account Created : {}", savedAccount.getAccountNumber());

        return accountMapper.toResponse(savedAccount);
    }

    public AccountResponse getAccount(String accountNumber) {

        Account account= accountRepository.findByAccountNumber(accountNumber).
                orElseThrow(()-> new ResourceNotFoundException("Account", "accountNumber", accountNumber));
        return accountMapper.toResponse(account);
    }

    public BigDecimal getAccountBalance(String accountNumber) {
        Account account= accountRepository.findByAccountNumber(accountNumber).
                orElseThrow(()-> new ResourceNotFoundException("Account", "accountNumber", accountNumber));
        return account.getBalance();
    }

    public void blockAccount(String accountNumber) {
    }

    public void deductBalance(String accountNumber, BigDecimal amount) {
    }

    public void creditBalance(String accountNumber, BigDecimal amount) {
    }
}
