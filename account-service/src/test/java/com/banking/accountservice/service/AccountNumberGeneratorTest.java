package com.banking.accountservice.service;

import com.banking.accountservice.repository.AccountRepository;
import org.junit.jupiter.api.RepeatedTest;
import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AccountNumberGeneratorTest {

    private final AccountRepository repository = mock(AccountRepository.class);
    private final AccountNumberGenerator generator = new AccountNumberGenerator(repository);

    @Test
    void luhnCheckDigitMatchesTheStandardExample() {
        // Classic published Luhn example: 7992739871 -> check digit 3 (79927398713)
        assertThat(AccountNumberGenerator.luhnCheckDigit("7992739871")).isEqualTo(3);
    }

    @RepeatedTest(20)
    void generatesTwelveDigitsWithoutLeadingZeroAndValidCheckDigit() {
        String number = generator.generate();

        assertThat(number).matches("[1-9]\\d{11}");
        assertThat(AccountNumberGenerator.isValid(number)).isTrue();
    }

    @Test
    void numbersAreRandomNotSequential() {
        Set<String> numbers = new HashSet<>();
        for (int i = 0; i < 1_000; i++) {
            numbers.add(generator.generate());
        }
        assertThat(numbers).hasSize(1_000);
    }

    @Test
    void checkDigitCatchesTypos() {
        String number = generator.generate();
        char[] digits = number.toCharArray();

        // one wrong digit
        char[] wrongDigit = digits.clone();
        wrongDigit[3] = (char) ('0' + (wrongDigit[3] - '0' + 1) % 10);
        assertThat(AccountNumberGenerator.isValid(new String(wrongDigit))).isFalse();

        // too short / not numeric / null
        assertThat(AccountNumberGenerator.isValid(number.substring(1))).isFalse();
        assertThat(AccountNumberGenerator.isValid("12345678901a")).isFalse();
        assertThat(AccountNumberGenerator.isValid(null)).isFalse();
    }

    @Test
    void retriesWhenNumberAlreadyExists() {
        when(repository.existsByAccountNumber(anyString())).thenReturn(true, true, false);

        String number = generator.generate();

        assertThat(AccountNumberGenerator.isValid(number)).isTrue();
        verify(repository, times(3)).existsByAccountNumber(anyString());
    }

    @Test
    void failsLoudlyIfEveryAttemptCollides() {
        when(repository.existsByAccountNumber(anyString())).thenReturn(true);

        assertThatThrownBy(generator::generate)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("unique account number");
    }
}
