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
    void blocksTheSenderNotTheReceiverOnFraudDetected() {
        consumer.consumeFraudDetected(Map.of("transactionId", "tx-1", "senderAccountNumber", "363100275256",
                "receiverAccountNumber", "562014000524", "amount", 99));

        verify(accountService).blockAccount("363100275256");
        verify(accountService, never()).blockAccount("562014000524");
    }

    @Test
    void rejectsFraudEventWithoutSenderAccountNumber() {
        assertThatThrownBy(() -> consumer.consumeFraudDetected(Map.of("receiverAccountNumber", "562014000524")))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("senderAccountNumber");
        verify(accountService, never()).blockAccount(anyString());
    }
}
