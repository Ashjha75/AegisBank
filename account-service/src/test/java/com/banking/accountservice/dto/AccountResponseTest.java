package com.banking.accountservice.dto;

import com.banking.accountservice.entity.Account;
import com.banking.accountservice.entity.AccountStatus;
import com.banking.accountservice.entity.AccountType;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class AccountResponseTest {

    @Test
    void mapsEveryFieldFromTheEntity() {
        LocalDateTime now = LocalDateTime.now();
        Account account = new Account("id-1", "asha@example.com", "9876543210", "Asha Rao", "AEGIS0000000001",
                AccountType.SAVINGS, AccountStatus.ACTIVE, new BigDecimal("2500.00"), new BigDecimal("100000.00"),
                now, now);

        AccountResponse response = AccountResponse.from(account, new BigDecimal("2000"));

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
}
