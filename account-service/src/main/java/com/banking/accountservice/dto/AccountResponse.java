package com.banking.accountservice.dto;

import com.banking.accountservice.entity.AccountStatus;
import com.banking.accountservice.entity.AccountType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Outgoing view of an account, returned by the API.
 * <p>
 * Never return the {@code Account} entity directly: this record decides exactly which
 * fields leave the service, so adding a column to the table can't leak it by accident.
 * Built by {@link com.banking.accountservice.mapper.AccountMapper#toResponse}.
 *
 * @param minimumBalance the minimum balance required for this account's type, from
 *                       {@code account.minimum-balance.<type>} (ACCOUNT_MIN_BALANCE_* in .env)
 */
public record AccountResponse(
        String id,
        String accountNumber,
        String accountHolderName,
        String email,
        String phone,
        AccountType accountType,
        AccountStatus accountStatus,
        BigDecimal balance,
        BigDecimal minimumBalance,
        BigDecimal dailyTransactionLimit,
        LocalDateTime createdAt
) {
}
