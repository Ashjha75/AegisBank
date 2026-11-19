package com.banking.accountservice.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Class-level check: the initial deposit must be at least the configured minimum balance
 * for the request's account type ({@code account.minimum-balance.<type>}).
 * The error is reported on the {@code initialDeposit} field.
 */
@Documented
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = MinimumInitialDepositValidator.class)
public @interface MinimumInitialDeposit {

    String message() default "Initial deposit is below the minimum balance for this account type";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
