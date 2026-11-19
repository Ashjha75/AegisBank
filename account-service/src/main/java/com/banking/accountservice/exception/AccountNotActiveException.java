package com.banking.accountservice.exception;

import com.banking.accountservice.entity.AccountStatus;

/**
 * The account exists but is BLOCKED or CLOSED, so money can't move (HTTP 422).
 * <pre>{@code
 * if (account.getAccountStatus() != AccountStatus.ACTIVE) {
 *     throw new AccountNotActiveException(account.getAccountNumber(), account.getAccountStatus());
 * }
 * }</pre>
 */
public class AccountNotActiveException extends BusinessException {

    public AccountNotActiveException(String accountNumber, AccountStatus status) {
        super(ErrorCode.ACCOUNT_NOT_ACTIVE, "Account " + accountNumber + " is " + status);
    }
}
