package com.banking.accountservice.mapper;

import com.banking.accountservice.config.AccountProperties;
import com.banking.accountservice.dto.AccountResponse;
import com.banking.accountservice.dto.CreateAccountRequest;
import com.banking.accountservice.entity.Account;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Converts between Account DTOs and the {@link Account} entity - hand-written, no mapping library.
 * <p>
 * The mapper only copies data. Business decisions (account number, status, limits) stay in
 * the service layer. Inject it like any other bean:
 * <pre>{@code
 * Account account = accountMapper.toEntity(request);
 * ...
 * return accountMapper.toResponse(accountRepository.save(account));
 * }</pre>
 */
@Component
@RequiredArgsConstructor
public class AccountMapper {

    private final AccountProperties accountProperties;

    /** Copies the client-supplied fields. The service must still set accountNumber, status and limits. */
    public Account toEntity(CreateAccountRequest request) {
        return Account.builder()
                .accountHolderName(request.accountHolderName())
                .email(request.email())
                .phone(request.phone())
                .accountType(request.accountType())
                .balance(request.initialDeposit())
                .build();
    }

    public AccountResponse toResponse(Account account) {
        return new AccountResponse(
                account.getId(),
                account.getAccountNumber(),
                account.getAccountHolderName(),
                account.getEmail(),
                account.getPhone(),
                account.getAccountType(),
                account.getAccountStatus(),
                account.getBalance(),
                accountProperties.minimumBalanceFor(account.getAccountType()),
                account.getDailyTransactionLimit(),
                account.getCreatedAt()
        );
    }
}
