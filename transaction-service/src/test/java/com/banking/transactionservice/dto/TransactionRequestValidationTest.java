package com.banking.transactionservice.dto;

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

class TransactionRequestValidationTest {

    private static final ValidatorFactory FACTORY = Validation.buildDefaultValidatorFactory();
    private static final Validator VALIDATOR = FACTORY.getValidator();

    @AfterAll
    static void close() {
        FACTORY.close();
    }

    private static Map<String, String> errors(TransferRequest request) {
        return VALIDATOR.validate(request).stream().collect(Collectors.toMap(
                v -> v.getPropertyPath().toString(), ConstraintViolation::getMessage, (a, b) -> a + "; " + b));
    }

    @Test
    void acceptsValidTransfer() {
        assertThat(errors(new TransferRequest("363100275256", "562014000524", new BigDecimal("10.50"), null)))
                .isEmpty();
    }

    @Test
    void rejectsZeroNegativeAndOverPreciseAmounts() {
        assertThat(errors(new TransferRequest("363100275256", "562014000524", BigDecimal.ZERO, null)))
                .containsEntry("amount", "Amount must be greater than zero");
        assertThat(errors(new TransferRequest("363100275256", "562014000524", new BigDecimal("-5"), null)))
                .containsKey("amount");
        assertThat(errors(new TransferRequest("363100275256", "562014000524", new BigDecimal("1.005"), null)))
                .containsKey("amount");
        assertThat(errors(new TransferRequest("363100275256", "562014000524", null, null)))
                .containsEntry("amount", "Amount is required");
    }

    @Test
    void rejectsMalformedAccountNumbers() {
        Map<String, String> errors = errors(new TransferRequest("12345", "0620140005241", BigDecimal.ONE, null));

        assertThat(errors).containsEntry("senderAccountNumber", "Sender account number must be 12 digits");
        assertThat(errors).containsEntry("receiverAccountNumber", "Receiver account number must be 12 digits");
    }

    @Test
    void rejectsTransferToTheSameAccount() {
        assertThat(errors(new TransferRequest("363100275256", "363100275256", BigDecimal.ONE, null)))
                .containsEntry("differentAccounts", "Sender and receiver accounts must be different");
    }

    @Test
    void rejectsTooLongDescription() {
        assertThat(errors(new TransferRequest("363100275256", "562014000524", BigDecimal.ONE, "x".repeat(256))))
                .containsKey("description");
    }
}
