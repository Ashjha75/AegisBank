package com.banking.accountservice.config;

import com.banking.accountservice.entity.AccountType;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Business settings for accounts, bound from the {@code account.*} keys in application.yml.
 * Values can be overridden with environment variables (e.g. ACCOUNT_MIN_BALANCE_SAVINGS=2000)
 * or an external config file, without changing code.
 *
 * @param minimumBalance minimum opening balance per account type; a missing type means no minimum (0)
 */
@ConfigurationProperties(prefix = "account")
public record AccountProperties(Map<AccountType, BigDecimal> minimumBalance) {

    public AccountProperties {
        minimumBalance = minimumBalance == null ? Map.of() : Map.copyOf(minimumBalance);
    }

    public BigDecimal minimumBalanceFor(AccountType type) {
        return minimumBalance.getOrDefault(type, BigDecimal.ZERO);
    }
}
