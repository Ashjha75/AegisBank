package com.banking.accountservice.service;

import com.banking.accountservice.entity.Account;
import com.banking.accountservice.entity.AccountStatus;
import com.banking.accountservice.exception.AccountNotActiveException;
import com.banking.accountservice.exception.BusinessException;
import com.banking.accountservice.exception.InsufficientBalanceException;
import com.banking.accountservice.exception.ResourceNotFoundException;
import com.banking.accountservice.mapper.AccountMapper;
import com.banking.accountservice.repository.AccountRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Money-movement rules of AccountService, with the repository mocked. */
class AccountServiceTest {

    private static final String NUMBER = "363100275256";

    private final AccountRepository repository = mock(AccountRepository.class);
    private final AccountService service = new AccountService(
            repository, mock(AccountMapper.class), mock(AccountNumberGenerator.class));

    private Account givenAccount(AccountStatus status, String balance) {
        Account account = Account.builder()
                .accountNumber(NUMBER).accountStatus(status).balance(new BigDecimal(balance)).build();
        when(repository.findByAccountNumberForUpdate(NUMBER)).thenReturn(Optional.of(account));
        return account;
    }

    @Test
    void deductSubtractsFromBalanceUsingTheLockingQuery() {
        Account account = givenAccount(AccountStatus.ACTIVE, "1000.00");

        service.deductBalance(NUMBER, new BigDecimal("250.50"));

        assertThat(account.getBalance()).isEqualByComparingTo("749.50");
        verify(repository, never()).findByAccountNumber(anyString()); // must use the FOR UPDATE lookup
    }

    @Test
    void deductRejectsMoreThanTheBalance() {
        Account account = givenAccount(AccountStatus.ACTIVE, "100.00");

        assertThatThrownBy(() -> service.deductBalance(NUMBER, new BigDecimal("100.01")))
                .isInstanceOf(InsufficientBalanceException.class);
        assertThat(account.getBalance()).isEqualByComparingTo("100.00");
    }

    @Test
    void deductRejectsBlockedAccount() {
        givenAccount(AccountStatus.BLOCKED, "1000.00");

        assertThatThrownBy(() -> service.deductBalance(NUMBER, BigDecimal.TEN))
                .isInstanceOf(AccountNotActiveException.class);
    }

    @ParameterizedTest
    @ValueSource(strings = {"0", "-500", "10.001"})
    void rejectsZeroNegativeAndOverPreciseAmounts(String amount) {
        Account account = givenAccount(AccountStatus.ACTIVE, "1000.00");

        assertThatThrownBy(() -> service.deductBalance(NUMBER, new BigDecimal(amount)))
                .isInstanceOf(BusinessException.class);
        assertThatThrownBy(() -> service.creditBalance(NUMBER, new BigDecimal(amount)))
                .isInstanceOf(BusinessException.class);
        assertThat(account.getBalance()).isEqualByComparingTo("1000.00"); // a negative deduct must never add money
    }

    @Test
    void rejectsNullAmount() {
        assertThatThrownBy(() -> service.creditBalance(NUMBER, null)).isInstanceOf(BusinessException.class);
    }

    @Test
    void creditStillWorksOnBlockedAccountSoSagaRefundsSucceed() {
        Account account = givenAccount(AccountStatus.BLOCKED, "100.00");

        service.creditBalance(NUMBER, new BigDecimal("50"));

        assertThat(account.getBalance()).isEqualByComparingTo("150.00");
    }

    @Test
    void creditRejectsClosedAccount() {
        givenAccount(AccountStatus.CLOSED, "0.00");

        assertThatThrownBy(() -> service.creditBalance(NUMBER, BigDecimal.ONE))
                .isInstanceOf(AccountNotActiveException.class);
    }

    @Test
    void blockSetsStatusAndIsIdempotent() {
        Account account = givenAccount(AccountStatus.ACTIVE, "10.00");

        service.blockAccount(NUMBER);
        service.blockAccount(NUMBER);

        assertThat(account.getAccountStatus()).isEqualTo(AccountStatus.BLOCKED);
    }

    @Test
    void unknownAccountThrowsNotFound() {
        when(repository.findByAccountNumberForUpdate(NUMBER)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.deductBalance(NUMBER, BigDecimal.ONE))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
