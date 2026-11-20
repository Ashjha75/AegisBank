package com.banking.accountservice.service;

import com.banking.accountservice.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;

/**
 * Generates unique 12-digit account numbers: 11 random digits + 1 Luhn check digit.
 * <ul>
 *   <li><b>Random, not sequential</b> - numbers can't be guessed by counting (...001, ...002).</li>
 *   <li><b>Check digit</b> - {@link #isValid(String)} catches typos (one wrong digit, two swapped
 *       digits) before money is sent to a wrong account. Same scheme as card numbers.</li>
 *   <li><b>Unique</b> - checked against the database with retries; the unique column on
 *       {@code accounts.account_number} is the final guard against a race between two requests.</li>
 * </ul>
 */
@Component
@RequiredArgsConstructor
public class AccountNumberGenerator {

    static final int LENGTH = 12;
    private static final int MAX_ATTEMPTS = 5;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final AccountRepository accountRepository;

    public String generate() {
        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            String candidate = randomCandidate();
            if (!accountRepository.existsByAccountNumber(candidate)) {
                return candidate;
            }
        }
        // ~90 billion possible numbers: reaching this means something is badly wrong
        throw new IllegalStateException("Could not generate a unique account number after " + MAX_ATTEMPTS + " attempts");
    }

    /** True if the value is 12 digits and its last digit is a correct Luhn check digit. */
    public static boolean isValid(String accountNumber) {
        if (accountNumber == null || !accountNumber.matches("[1-9]\\d{" + (LENGTH - 1) + "}")) {
            return false;
        }
        String body = accountNumber.substring(0, LENGTH - 1);
        return luhnCheckDigit(body) == accountNumber.charAt(LENGTH - 1) - '0';
    }

    static String randomCandidate() {
        StringBuilder body = new StringBuilder(LENGTH);
        body.append(1 + RANDOM.nextInt(9));          // first digit 1-9: never a leading zero
        for (int i = 1; i < LENGTH - 1; i++) {
            body.append(RANDOM.nextInt(10));
        }
        return body.toString() + luhnCheckDigit(body.toString());
    }

    /** Luhn: from the right, double every second digit (subtract 9 if > 9), sum, and pad to a multiple of 10. */
    static int luhnCheckDigit(String digits) {
        int sum = 0;
        boolean doubleIt = true; // the rightmost body digit is doubled, because the check digit will follow it
        for (int i = digits.length() - 1; i >= 0; i--) {
            int digit = digits.charAt(i) - '0';
            if (doubleIt) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }
            sum += digit;
            doubleIt = !doubleIt;
        }
        return (10 - sum % 10) % 10;
    }
}
