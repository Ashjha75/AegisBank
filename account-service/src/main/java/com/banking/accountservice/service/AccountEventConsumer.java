package com.banking.accountservice.service;

import com.banking.accountservice.exception.BusinessException;
import com.banking.accountservice.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class AccountEventConsumer {

    private  final AccountService accountService;

    /**
     * Consume transaction.completed event from Kafka. </br>
     * Credit receiver account
     * @param payload
     */
   @KafkaListener(topics = "transaction.completed")
    public void consumeTransactionCompleted(@Payload Map<String, Object> payload) {
        log.info("Received Transaction Payload : {}", payload);
        try {
            String receiverAccountNumber = payload.get("receiverAccountNumber").toString();
            BigDecimal amount = (BigDecimal) payload.get("amount");

            log.info("Crediting account {} with amount: {}",receiverAccountNumber,amount);
            accountService.creditBalance(receiverAccountNumber,amount);
        }
        catch (Exception e) {
            log.error("Error while processing transaction completed : {}",e.getMessage());
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,e.getMessage());
        }
    }

    /**
     * Consume: fraud detected, event from Kafka.
     * Blocks the flagged account .
     * @param payload
     */
    @KafkaListener(topics = "fraud.detected")
    public void consumeFraudDetected(@Payload Map<String, Object> payload) {
        log.info("Received Fraud Transaction Payload : {}", payload);
        try {
            String receiverAccountNumber = payload.get("receiverAccountNumber").toString();
            BigDecimal amount = (BigDecimal) payload.get("amount");

            log.info("Blocked account {} ",receiverAccountNumber);
            accountService.blockAccount(receiverAccountNumber);
        }
        catch (Exception e) {
            log.error("Error while blocking account  : {}",e.getMessage());
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,e.getMessage());
        }
    }
}
