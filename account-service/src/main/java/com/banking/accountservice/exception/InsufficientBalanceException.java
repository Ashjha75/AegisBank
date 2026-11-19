package com.banking.accountservice.exception;

import java.math.BigDecimal;

/**
 * A debit would take the balance below what is allowed (HTTP 422).
 * The message deliberately does not reveal the current balance.
 * <pre>{@code
 * if (account.getBalance().compareTo(amount) < 0) {
 *     throw new InsufficientBalanceException(account.getAccountNumber(), amount);
 * }
 * }</pre>
 */
public class InsufficientBalanceException extends BusinessException {

    public InsufficientBalanceException(String accountNumber, BigDecimal requestedAmount) {
        super(ErrorCode.INSUFFICIENT_BALANCE,
                "Insufficient balance in account " + accountNumber + " to debit " + requestedAmount.toPlainString());
    }
}
