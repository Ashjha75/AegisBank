package com.banking.accountservice.config;

import com.banking.accountservice.exception.BusinessException;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.util.backoff.FixedBackOff;

/**
 * What happens when a @KafkaListener throws (Spring Boot applies this bean to every listener):
 * <ul>
 *   <li>Temporary problems (DB briefly down, lock timeout): retried 3 times, 1 second apart.</li>
 *   <li>Business/validation errors (account not found, bad payload): NOT retried - retrying can't fix them.</li>
 *   <li>Either way, a message that still fails is published to {@code <topic>-dlt}
 *       (e.g. {@code transaction.completed-dlt}) instead of being lost, so it can be inspected and replayed.</li>
 * </ul>
 */
@Configuration
public class KafkaConfig {

    @Bean
    public DefaultErrorHandler kafkaErrorHandler(KafkaTemplate<?, ?> kafkaTemplate) {
        DeadLetterPublishingRecoverer deadLetterRecoverer = new DeadLetterPublishingRecoverer(kafkaTemplate);
        DefaultErrorHandler errorHandler = new DefaultErrorHandler(deadLetterRecoverer, new FixedBackOff(1_000L, 3));
        errorHandler.addNotRetryableExceptions(BusinessException.class, IllegalArgumentException.class);
        return errorHandler;
    }
}
