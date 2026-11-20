package com.banking.accountservice.service;

import com.banking.accountservice.dto.AccountResponse;
import com.banking.accountservice.dto.CreateAccountRequest;
import com.banking.accountservice.entity.Account;
import com.banking.accountservice.entity.AccountStatus;
import com.banking.accountservice.entity.AccountType;
import com.banking.accountservice.exception.*;
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

    @Transactional(readOnly = true)
    public AccountResponse getAccount(String accountNumber) {
        return accountMapper.toResponse(findAccount(accountNumber));
    }

    @Transactional(readOnly = true)
    public BigDecimal getAccountBalance(String accountNumber) {
        return findAccount(accountNumber).getBalance();
    }

    /**
     * Block account - called by Fraud detection service via Kafka.
     * Blocking stops debits only; credits (e.g. SAGA refunds) are still accepted.
     */
    @Transactional
    public void blockAccount(String accountNumber) {
        log.info("Blocking Account for : {}", accountNumber);
        Account account = findAccountForUpdate(accountNumber);
        if (account.getAccountStatus() == AccountStatus.BLOCKED) {
            log.info("Account {} is already blocked", accountNumber);
            return;
        }
        account.setAccountStatus(AccountStatus.BLOCKED);
        log.info("Account blocked : {}", accountNumber);
    }

    /**
     * Deduct balance from sender account (SAGA step 1). Called by transaction service.
     * Runs in a transaction with the account row locked, so concurrent debits can't overspend.
     */
    @Transactional
    public void deductBalance(String accountNumber, BigDecimal amount) {
        requireValidAmount(amount);
        log.info("Deducting balance {} from account: {}", amount, accountNumber);
        Account account = findAccountForUpdate(accountNumber);
        if (account.getAccountStatus() != AccountStatus.ACTIVE) {
            throw new AccountNotActiveException(accountNumber, account.getAccountStatus());
        }
        if (account.getBalance().compareTo(amount) < 0) {
            throw new InsufficientBalanceException(accountNumber, amount);
        }
        // No save() needed: the entity is managed, so the change is written when the transaction commits
        account.setBalance(account.getBalance().subtract(amount));
        log.info("Account deducted : {} successfully", accountNumber);
    }

    /**
     * Credit balance: credit the receiver on transaction.completed, or refund the sender when a
     * transfer is rolled back (SAGA compensation). Called by transaction service / via Kafka.
     * <p>
     * BLOCKED accounts still accept credits - otherwise a refund to a sender blocked for fraud
     * would fail and the money would be stuck. Only CLOSED accounts reject credits.
     */
    @Transactional
    public void creditBalance(String accountNumber, BigDecimal amount) {
        requireValidAmount(amount);
        log.info("Credit {} to account: {} ", amount, accountNumber);
        Account account = findAccountForUpdate(accountNumber);
        if (account.getAccountStatus() == AccountStatus.CLOSED) {
            throw new AccountNotActiveException(accountNumber, account.getAccountStatus());
        }
        account.setBalance(account.getBalance().add(amount));
        log.info("Account credited : {} successfully", accountNumber);
    }

    private Account findAccount(String accountNumber) {
        return accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Account", "accountNumber", accountNumber));
    }

    private Account findAccountForUpdate(String accountNumber) {
        return accountRepository.findByAccountNumberForUpdate(accountNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Account", "accountNumber", accountNumber));
    }

    /**
     * Amounts must be positive with at most 2 decimal places. Checked here, not only in the controller,
     * because Kafka events reach these methods without going through any controller validation.
     * Without it, deducting -500 would ADD 500.
     */
    private static void requireValidAmount(BigDecimal amount) {
        if (amount == null || amount.signum() <= 0) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Amount must be greater than zero");
        }
        if (amount.stripTrailingZeros().scale() > 2) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Amount can have at most 2 decimal places");
        }
    }
}
