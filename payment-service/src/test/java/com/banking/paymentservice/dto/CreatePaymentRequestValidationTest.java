package com.banking.paymentservice.dto;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Map;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

class CreatePaymentRequestValidationTest {

    private static final ValidatorFactory FACTORY = Validation.buildDefaultValidatorFactory();
    private static final Validator VALIDATOR = FACTORY.getValidator();
    private static final String ACCOUNT = "363100275256";

    @AfterAll
    static void close() {
        FACTORY.close();
    }

    private static Map<String, String> errors(CreatePaymentRequest request) {
        return VALIDATOR.validate(request).stream().collect(Collectors.toMap(
                v -> v.getPropertyPath().toString(), ConstraintViolation::getMessage, (a, b) -> a + "; " + b));
    }

    @Test
    void acceptsValidRequest() {
        assertThat(errors(new CreatePaymentRequest(ACCOUNT, new BigDecimal("499.99"), "Add money"))).isEmpty();
        assertThat(errors(new CreatePaymentRequest(ACCOUNT, new BigDecimal("10"), null))).isEmpty();
    }

    @Test
    void rejectsMissingOrMalformedAccountNumber() {
        assertThat(errors(new CreatePaymentRequest(" ", BigDecimal.TEN, null))).containsKey("accountNumber");
        assertThat(errors(new CreatePaymentRequest("12345", BigDecimal.TEN, null)))
                .containsEntry("accountNumber", "Account number must be 12 digits");
    }

    @Test
    void rejectsMissingZeroNegativeAndOverPreciseAmounts() {
        assertThat(errors(new CreatePaymentRequest(ACCOUNT, null, null)))
                .containsEntry("amount", "Amount is required");
        assertThat(errors(new CreatePaymentRequest(ACCOUNT, BigDecimal.ZERO, null)))
                .containsEntry("amount", "Amount must be greater than zero");
        assertThat(errors(new CreatePaymentRequest(ACCOUNT, new BigDecimal("-1"), null))).containsKey("amount");
        assertThat(errors(new CreatePaymentRequest(ACCOUNT, new BigDecimal("1.005"), null))).containsKey("amount");
    }

    @Test
    void rejectsTooLongDescription() {
        assertThat(errors(new CreatePaymentRequest(ACCOUNT, BigDecimal.TEN, "x".repeat(256))))
                .containsKey("description");
    }
}
