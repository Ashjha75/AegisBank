package com.banking.accountservice.validation;

import com.banking.accountservice.config.AccountProperties;
import com.banking.accountservice.dto.CreateAccountRequest;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.math.BigDecimal;

/**
 * Spring creates this validator, so {@link AccountProperties} is injected through the constructor.
 */
public class MinimumInitialDepositValidator
        implements ConstraintValidator<MinimumInitialDeposit, CreateAccountRequest> {

    private final AccountProperties accountProperties;

    public MinimumInitialDepositValidator(AccountProperties accountProperties) {
        this.accountProperties = accountProperties;
    }

    @Override
    public boolean isValid(CreateAccountRequest request, ConstraintValidatorContext context) {
        // Missing or negative values are already reported by the field-level constraints.
        if (request == null || request.accountType() == null || request.initialDeposit() == null) {
            return true;
        }

        BigDecimal minimum = accountProperties.minimumBalanceFor(request.accountType());
        if (request.initialDeposit().compareTo(minimum) >= 0) {
            return true;
        }

        context.disableDefaultConstraintViolation();
        context.buildConstraintViolationWithTemplate(
                        "Initial deposit must be at least " + minimum.toPlainString()
                                + " for a " + request.accountType() + " account")
                .addPropertyNode("initialDeposit")
                .addConstraintViolation();
        return false;
    }
}
