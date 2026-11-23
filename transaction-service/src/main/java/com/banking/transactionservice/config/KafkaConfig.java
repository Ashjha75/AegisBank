package com.banking.transactionservice.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

/** Kafka topics this service publishes to. Spring creates them on startup if they don't exist yet. */
@Configuration
public class KafkaConfig {

    /** Topic read by fraud-detection-service. Keep the name in sync with its @KafkaListener. */
    public static final String TRANSACTION_INITIATED_TOPIC = "transaction.initiated";

    @Bean
    public NewTopic transactionInitiatedTopic() {
        return TopicBuilder.name(TRANSACTION_INITIATED_TOPIC).partitions(3).replicas(1).build();
    }
}
