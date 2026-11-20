package com.banking.accountservice.service;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

class AccountEventConsumerTest {

    private final AccountService accountService = mock(AccountService.class);
    private final AccountEventConsumer consumer = new AccountEventConsumer(accountService);

    @Test
    void creditsReceiverWhenAmountArrivesAsIntegerOrDouble() {
        // This is how JSON numbers look after deserializing into a Map - a (BigDecimal) cast would fail
        consumer.consumeTransactionCompleted(Map.of("receiverAccountNumber", "363100275256", "amount", 500));
        consumer.consumeTransactionCompleted(Map.of("receiverAccountNumber", "363100275256", "amount", 250.75));

        verify(accountService).creditBalance("363100275256", new BigDecimal("500"));
        verify(accountService).creditBalance("363100275256", new BigDecimal("250.75"));
    }

    @Test
    void rejectsEventWithMissingOrBadFieldsWithoutTouchingBalances() {
        Map<String, Object> noReceiver = new HashMap<>(Map.of("amount", 10));
        Map<String, Object> badAmount = Map.of("receiverAccountNumber", "363100275256", "amount", "ten");

        assertThatThrownBy(() -> consumer.consumeTransactionCompleted(noReceiver))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("receiverAccountNumber");
        assertThatThrownBy(() -> consumer.consumeTransactionCompleted(badAmount))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("amount");
        verify(accountService, never()).creditBalance(anyString(), any());
    }

    @Test
    void blocksAccountOnFraudDetected() {
        consumer.consumeFraudDetected(Map.of("receiverAccountNumber", "363100275256", "amount", 99));

        verify(accountService).blockAccount("363100275256");
    }
}
