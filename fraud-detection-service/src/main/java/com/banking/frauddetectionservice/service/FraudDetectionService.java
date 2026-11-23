package com.banking.frauddetectionservice.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Map;

@Service
@Slf4j
public class FraudDetectionService {
    public void processFraudDetectionEvent(Map<String,Object> payload) {
        String transactionId = (String) payload.get("transactionId");
        String accountId = (String) payload.get("accountId");
        BigDecimal amount = new BigDecimal((String) payload.get("amount"));
        log.info("Processing fraud detection event: {}", transactionId);

        // Fetch the account balance using AccountService

    }
}
