package com.banking.frauddetectionservice.config;

import feign.FeignException;
import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.util.backoff.FixedBackOff;

/**
 * Kafka topics and listener error handling for fraud-detection-service.
 * <ul>
 *   <li>Reads {@link #TRANSACTION_INITIATED_TOPIC} (published by transaction-service).</li>
 *   <li>Publishes the verdict to {@link #FRAUD_CHECK_CLEAN_TOPIC} or {@link #VERIFICATION_REQUIRED_TOPIC}.</li>
 *   <li>A listener that throws is retried 3 times, 1 second apart (account-service down, Redis blip);
 *       bad payloads and unknown accounts are not retried. A message that still fails goes to
 *       {@code <topic>-dlt} (e.g. {@code transaction.initiated-dlt}) instead of being lost.</li>
 * </ul>
 */
@Configuration
public class KafkaConfig {

    /** Published by transaction-service. Keep in sync with its KafkaConfig. */
    public static final String TRANSACTION_INITIATED_TOPIC = "transaction.initiated";
    /** Transaction passed every check - safe to credit the receiver. */
    public static final String FRAUD_CHECK_CLEAN_TOPIC = "fraud.check.clean";
    /** Transaction looks suspicious - the sender must confirm it (OTP) before it completes. */
    public static final String VERIFICATION_REQUIRED_TOPIC = "verification.required";

    @Bean
    public NewTopic fraudCheckCleanTopic() {
        return TopicBuilder.name(FRAUD_CHECK_CLEAN_TOPIC).partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic verificationRequiredTopic() {
        return TopicBuilder.name(VERIFICATION_REQUIRED_TOPIC).partitions(3).replicas(1).build();
    }

    @Bean
    public DefaultErrorHandler kafkaErrorHandler(KafkaTemplate<?, ?> kafkaTemplate) {
        DeadLetterPublishingRecoverer deadLetterRecoverer = new DeadLetterPublishingRecoverer(kafkaTemplate);
        DefaultErrorHandler errorHandler = new DefaultErrorHandler(deadLetterRecoverer, new FixedBackOff(1_000L, 3));
        errorHandler.addNotRetryableExceptions(IllegalArgumentException.class, FeignException.NotFound.class);
        return errorHandler;
    }
}
