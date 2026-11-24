package com.banking.notificationservice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.util.backoff.FixedBackOff;

/**
 * What happens when a @KafkaListener throws (Spring Boot applies this bean to every listener):
 * <ul>
 *   <li>Temporary problems (e.g. mail server down): retried 3 times, 1 second apart.</li>
 *   <li>Bad events (missing field, amount not a number): NOT retried - retrying can't fix them.</li>
 *   <li>A message that still fails goes to {@code <topic>-dlt} (e.g. {@code transaction.failed-dlt})
 *       instead of being lost, so the alert can be inspected and re-sent.</li>
 * </ul>
 */
@Configuration
public class KafkaConfig {

    @Bean
    public DefaultErrorHandler kafkaErrorHandler(KafkaTemplate<?, ?> kafkaTemplate) {
        DeadLetterPublishingRecoverer deadLetterRecoverer = new DeadLetterPublishingRecoverer(kafkaTemplate);
        DefaultErrorHandler errorHandler = new DefaultErrorHandler(deadLetterRecoverer, new FixedBackOff(1_000L, 3));
        errorHandler.addNotRetryableExceptions(IllegalArgumentException.class);
        return errorHandler;
    }
}
