package com.banking.accountservice.mapper;

import com.banking.accountservice.config.AccountProperties;
import com.banking.accountservice.dto.AccountResponse;
import com.banking.accountservice.dto.CreateAccountRequest;
import com.banking.accountservice.entity.Account;
import com.banking.accountservice.entity.AccountStatus;
import com.banking.accountservice.entity.AccountType;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/** Plain unit test - no Spring context needed. */
class AccountMapperTest {

    private final AccountMapper mapper = new AccountMapper(new AccountProperties(Map.of(
            AccountType.SAVINGS, new BigDecimal("2000"),
            AccountType.CURRENT, new BigDecimal("5000"))));

    @Test
    void toEntityCopiesOnlyClientSuppliedFields() {
        CreateAccountRequest request = new CreateAccountRequest(
                "asha@example.com", "9876543210", AccountType.SAVINGS, "Asha Rao", new BigDecimal("2500.00"));

        Account account = mapper.toEntity(request);

        assertThat(account.getEmail()).isEqualTo("asha@example.com");
        assertThat(account.getPhone()).isEqualTo("9876543210");
        assertThat(account.getAccountType()).isEqualTo(AccountType.SAVINGS);
        assertThat(account.getAccountHolderName()).isEqualTo("Asha Rao");
        assertThat(account.getBalance()).isEqualByComparingTo("2500.00");
        // Business fields are the service's job, not the mapper's
        assertThat(account.getId()).isNull();
        assertThat(account.getAccountNumber()).isNull();
        assertThat(account.getAccountStatus()).isNull();
        assertThat(account.getDailyTransactionLimit()).isNull();
    }

    @Test
    void toResponseMapsEveryFieldAndAddsMinimumBalanceForTheType() {
        LocalDateTime now = LocalDateTime.now();
        Account account = new Account("id-1", "asha@example.com", "9876543210", "Asha Rao", "AEGIS0000000001",
                AccountType.SAVINGS, AccountStatus.ACTIVE, new BigDecimal("2500.00"), new BigDecimal("100000.00"),
                now, now);

        AccountResponse response = mapper.toResponse(account);

        assertThat(response.id()).isEqualTo("id-1");
        assertThat(response.accountNumber()).isEqualTo("AEGIS0000000001");
        assertThat(response.accountHolderName()).isEqualTo("Asha Rao");
        assertThat(response.email()).isEqualTo("asha@example.com");
        assertThat(response.phone()).isEqualTo("9876543210");
        assertThat(response.accountType()).isEqualTo(AccountType.SAVINGS);
        assertThat(response.accountStatus()).isEqualTo(AccountStatus.ACTIVE);
        assertThat(response.balance()).isEqualByComparingTo("2500");
        assertThat(response.minimumBalance()).isEqualByComparingTo("2000");
        assertThat(response.dailyTransactionLimit()).isEqualByComparingTo("100000");
        assertThat(response.createdAt()).isEqualTo(now);
    }

    @Test
    void toResponseUsesZeroMinimumWhenTypeIsNotConfigured() {
        Account account = Account.builder().accountType(AccountType.FIXED_DEPOSIT).build();

        assertThat(mapper.toResponse(account).minimumBalance()).isEqualByComparingTo("0");
    }
}
