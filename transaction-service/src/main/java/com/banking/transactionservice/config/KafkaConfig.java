package com.banking.transactionservice.config;

import com.banking.transactionservice.exception.BusinessException;
import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.util.backoff.FixedBackOff;

/**
 * Kafka topics of transaction-service and what happens when a @KafkaListener throws:
 * <ul>
 *   <li>Temporary problems (DB, Redis or Kafka briefly down): retried 3 times, 1 second apart.</li>
 *   <li>Business/validation errors (unknown transaction, bad payload): NOT retried.</li>
 *   <li>A message that still fails goes to {@code <topic>-dlt} instead of being lost.</li>
 * </ul>
 */
@Configuration
public class KafkaConfig {

    /** Published here, read by fraud-detection-service. */
    public static final String TRANSACTION_INITIATED_TOPIC = "transaction.initiated";
    /** Published by fraud-detection-service: fraud checks passed. */
    public static final String FRAUD_CHECK_CLEAN_TOPIC = "fraud.check.clean";
    /** Published by fraud-detection-service: transfer looks suspicious, OTP needed. */
    public static final String VERIFICATION_REQUIRED_TOPIC = "verification.required";
    /** Published here, read by notification-service, which sends the OTP to the sender. */
    public static final String OTP_GENERATED_TOPIC = "transaction.otp.generated";
    /** Published here once the receiver is credited. Informational only - nobody may move money on it. */
    public static final String TRANSACTION_COMPLETED_TOPIC = "transaction.completed";
    /** Published here when a transfer ends FAILED or FLAGGED. Informational only (notification-service). */
    public static final String TRANSACTION_FAILED_TOPIC = "transaction.failed";

    @Bean
    public NewTopic transactionInitiatedTopic() {
        return TopicBuilder.name(TRANSACTION_INITIATED_TOPIC).partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic otpGeneratedTopic() {
        return TopicBuilder.name(OTP_GENERATED_TOPIC).partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic transactionCompletedTopic() {
        return TopicBuilder.name(TRANSACTION_COMPLETED_TOPIC).partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic transactionFailedTopic() {
        return TopicBuilder.name(TRANSACTION_FAILED_TOPIC).partitions(3).replicas(1).build();
    }

    @Bean
    public DefaultErrorHandler kafkaErrorHandler(KafkaTemplate<?, ?> kafkaTemplate) {
        DeadLetterPublishingRecoverer deadLetterRecoverer = new DeadLetterPublishingRecoverer(kafkaTemplate);
        DefaultErrorHandler errorHandler = new DefaultErrorHandler(deadLetterRecoverer, new FixedBackOff(1_000L, 3));
        errorHandler.addNotRetryableExceptions(BusinessException.class, IllegalArgumentException.class);
        return errorHandler;
    }
}
