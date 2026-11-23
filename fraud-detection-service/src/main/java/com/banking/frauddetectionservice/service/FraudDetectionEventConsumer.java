package com.banking.frauddetectionservice.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class FraudDetectionEventConsumer {
    private final FraudDetectionService fraudDetectionService;

    /**
     * Listen to transaction.initiated topics.</br>
     * Every transaction goes through a fraud check before completing .
     * @param payload
     */

    @KafkaListener(topics = "${kafka.topic.fraud-detection}", groupId = "${kafka.group-id}")
    public void consumeFraudDetectionEvent(@payload Map<String,Object> payload) {
        log.info("Consuming fraud detection event: {}", payload.get("transactionId"));
        try {
            fraudDetectionService.processFraudDetectionEvent(payload);
        } catch (Exception e) {
            log.error("Error occurred while processing fraud detection event: {}", payload.get("transactionId"), e);
        }
    }
}
