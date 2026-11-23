package com.banking.frauddetectionservice.service;

import com.banking.frauddetectionservice.config.KafkaConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Service;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class FraudDetectionEventConsumer {

    private final FraudDetectionService fraudDetectionService;

    /**
     * Listens to {@code transaction.initiated}: every transfer goes through the fraud checks before it completes.
     * Exceptions are not caught here - the DefaultErrorHandler (see KafkaConfig) retries and then
     * sends the message to {@code transaction.initiated-dlt}.
     *
     * @param payload TransactionInitiatedEvent from transaction-service, read as a Map
     */
    @KafkaListener(topics = KafkaConfig.TRANSACTION_INITIATED_TOPIC)
    public void consumeTransactionInitiated(@Payload Map<String, Object> payload) {
        log.info("Received transaction.initiated event for transaction {}", payload.get("transactionId"));
        fraudDetectionService.processFraudDetectionEvent(payload);
    }
}
