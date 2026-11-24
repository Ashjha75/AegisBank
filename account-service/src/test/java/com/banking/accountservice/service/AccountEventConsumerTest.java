package com.banking.accountservice.service;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

class AccountEventConsumerTest {

    private final AccountService accountService = mock(AccountService.class);
    private final AccountEventConsumer consumer = new AccountEventConsumer(accountService);

    @Test
    void blocksAccountOnFraudDetected() {
        consumer.consumeFraudDetected(Map.of("receiverAccountNumber", "363100275256", "amount", 99));

        verify(accountService).blockAccount("363100275256");
    }

    @Test
    void rejectsFraudEventWithoutAccountNumber() {
        assertThatThrownBy(() -> consumer.consumeFraudDetected(Map.of("amount", 99)))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("receiverAccountNumber");
        verify(accountService, never()).blockAccount(anyString());
    }
}
