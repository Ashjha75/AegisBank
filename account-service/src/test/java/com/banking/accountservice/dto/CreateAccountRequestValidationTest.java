package com.banking.accountservice.dto;

import com.banking.accountservice.config.AccountProperties;
import com.banking.accountservice.entity.AccountType;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Runs the real Spring validator so the minimum balance comes from configuration,
 * exactly as it does for an incoming HTTP request.
 */
@SpringBootTest(properties = {
        "account.minimum-balance.savings=2000",
        "account.minimum-balance.current=5000",
        "account.minimum-balance.fixed-deposit=1000"
})
class CreateAccountRequestValidationTest {

    @Autowired
    private Validator validator;

    @Autowired
    private AccountProperties accountProperties;

    private static CreateAccountRequest request(AccountType type, String deposit) {
        return new CreateAccountRequest("asha@example.com", "9876543210", type, "Asha Rao",
                deposit == null ? null : new BigDecimal(deposit));
    }

    private Map<String, String> errors(CreateAccountRequest request) {
        Set<ConstraintViolation<CreateAccountRequest>> violations = validator.validate(request);
        return violations.stream().collect(Collectors.toMap(
                v -> v.getPropertyPath().toString(), ConstraintViolation::getMessage, (a, b) -> a + "; " + b));
    }

    @Test
    void bindsMinimumBalancesFromConfiguration() {
        assertThat(accountProperties.minimumBalanceFor(AccountType.SAVINGS)).isEqualByComparingTo("2000");
        assertThat(accountProperties.minimumBalanceFor(AccountType.FIXED_DEPOSIT)).isEqualByComparingTo("1000");
    }

    @Test
    void acceptsDepositAtOrAboveMinimum() {
        assertThat(errors(request(AccountType.SAVINGS, "2000"))).isEmpty();
        assertThat(errors(request(AccountType.CURRENT, "7500.50"))).isEmpty();
    }

    @Test
    void rejectsDepositBelowMinimumForAccountType() {
        assertThat(errors(request(AccountType.SAVINGS, "1999.99")))
                .containsEntry("initialDeposit", "Initial deposit must be at least 2000 for a SAVINGS account");
    }

    @Test
    void rejectsNegativeMissingAndOverPreciseDeposits() {
        assertThat(errors(request(AccountType.SAVINGS, "-1"))).containsKey("initialDeposit");
        assertThat(errors(request(AccountType.SAVINGS, null)))
                .containsEntry("initialDeposit", "Initial deposit is required");
        assertThat(errors(request(AccountType.SAVINGS, "2000.123"))).containsKey("initialDeposit");
    }

    @Test
    void reportsMissingAccountTypeInsteadOfCrashing() {
        assertThat(errors(request(null, "5000")))
                .containsEntry("accountType", "Account type is required");
    }

    @Test
    void validatesIndianMobileNumber() {
        CreateAccountRequest badPhone = new CreateAccountRequest(
                "asha@example.com", "12345", AccountType.SAVINGS, "Asha Rao", new BigDecimal("5000"));
        assertThat(errors(badPhone)).containsKey("phone");
    }
}
