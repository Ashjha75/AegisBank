package com.banking.frauddetectionservice.service;

import com.banking.frauddetectionservice.client.AccountServiceClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class FraudDetectionService {

    private final AccountServiceClient accountServiceClient;

    public void processFraudDetectionEvent(Map<String, Object> payload) {
        String transactionId = (String) payload.get("transactionId");
        String accountId = (String) payload.get("accountId");
        BigDecimal amount = new BigDecimal((String) payload.get("amount"));
        log.info("Processing fraud detection event: {}", transactionId);

        // Fetch the account balance using AccountService

        BigDecimal accountBalance = accountServiceClient.getBalance(accountId);
        log.info("Checking transaction: {} for account: {}, amount: {}, balance: {}", transactionId, accountId, amount, accountBalance);



    }
}
