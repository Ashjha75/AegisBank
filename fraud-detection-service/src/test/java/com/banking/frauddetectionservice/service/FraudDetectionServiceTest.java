package com.banking.frauddetectionservice.service;

import com.banking.frauddetectionservice.client.AccountServiceClient;
import com.banking.frauddetectionservice.config.FraudProperties;
import com.banking.frauddetectionservice.config.KafkaConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class FraudDetectionServiceTest {

    private static final String SENDER = "758885717853";
    private static final String RECEIVER = "755016767385";

    @Mock private AccountServiceClient accountServiceClient;
    @Mock private KafkaTemplate<String, Object> kafkaTemplate;
    @Mock private StringRedisTemplate redisTemplate;
    @Mock private ValueOperations<String, String> valueOps;
    @Mock private HashOperations<String, Object, Object> hashOps;

    private FraudDetectionService service;

    @BeforeEach
    void setUp() {
        FraudProperties properties = new FraudProperties(5, new BigDecimal("5.0"), new BigDecimal("0.90"));
        service = new FraudDetectionService(accountServiceClient, kafkaTemplate, redisTemplate, properties);

        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(redisTemplate.opsForHash()).thenReturn(hashOps);
        when(valueOps.increment(anyString())).thenReturn(1L);
        when(hashOps.entries(anyString())).thenReturn(Map.of());
        CompletableFuture<SendResult<String, Object>> sent = CompletableFuture.completedFuture(null);
        when(kafkaTemplate.send(anyString(), anyString(), any())).thenReturn(sent);
    }

    @Test
    void cleanTransactionIsPublishedToCleanTopicAndRecorded() {
        // amount arrives as a JSON number (Double), as transaction-service sends it
        when(accountServiceClient.getBalance(SENDER)).thenReturn(new BigDecimal("9500.00"));

        service.processFraudDetectionEvent(event(500.00));

        Map<String, Object> verdict = publishedTo(KafkaConfig.FRAUD_CHECK_CLEAN_TOPIC);
        assertThat(verdict).containsEntry("fraud", false).containsEntry("transactionId", "tx-1");
        verify(hashOps).increment(FraudDetectionService.AMOUNT_STATS_KEY_PREFIX + SENDER,
                FraudDetectionService.STATS_SUM_PAISE, 50_000L);
    }

    @Test
    void velocityAboveLimitRequiresVerification() {
        when(accountServiceClient.getBalance(SENDER)).thenReturn(new BigDecimal("100000"));
        when(valueOps.increment(FraudDetectionService.VELOCITY_KEY_PREFIX + SENDER)).thenReturn(6L);

        service.processFraudDetectionEvent(event(100));

        assertThat(publishedTo(KafkaConfig.VERIFICATION_REQUIRED_TOPIC))
                .containsEntry("fraud", true)
                .extractingByKey("reason").asString().contains("Velocity");
        verify(hashOps, never()).increment(anyString(), any(), anyLong());
    }

    @Test
    void amountAboveMultipleOfAverageRequiresVerification() {
        when(accountServiceClient.getBalance(SENDER)).thenReturn(new BigDecimal("1000000"));
        // 2 past transfers totalling 2,000.00 -> average 1,000.00 -> threshold 5,000.00
        when(hashOps.entries(FraudDetectionService.AMOUNT_STATS_KEY_PREFIX + SENDER))
                .thenReturn(Map.of(FraudDetectionService.STATS_COUNT, "2", FraudDetectionService.STATS_SUM_PAISE, "200000"));

        service.processFraudDetectionEvent(event(5000.01));

        assertThat(publishedTo(KafkaConfig.VERIFICATION_REQUIRED_TOPIC))
                .extractingByKey("reason").asString().contains("average");
    }

    @Test
    void balanceCheckUsesBalanceBeforeTheDebit() {
        // sender had 1,000 and sent 950 (95%) -> 50 left after transaction-service's debit
        when(accountServiceClient.getBalance(SENDER)).thenReturn(new BigDecimal("50.00"));

        service.processFraudDetectionEvent(event(950));

        assertThat(publishedTo(KafkaConfig.VERIFICATION_REQUIRED_TOPIC))
                .extractingByKey("reason").asString().contains("90%");
    }

    @Test
    void transferBelowBalanceLimitIsClean() {
        // sender had 1,000 and sent 800 (80%)
        when(accountServiceClient.getBalance(SENDER)).thenReturn(new BigDecimal("200.00"));

        service.processFraudDetectionEvent(event(800));

        assertThat(publishedTo(KafkaConfig.FRAUD_CHECK_CLEAN_TOPIC)).containsEntry("fraud", false);
    }

    @Test
    void invalidEventIsRejectedWithoutSideEffects() {
        Map<String, Object> missingSender = event(100);
        missingSender.remove("senderAccountNumber");
        assertThatThrownBy(() -> service.processFraudDetectionEvent(missingSender))
                .isInstanceOf(IllegalArgumentException.class);

        assertThatThrownBy(() -> service.processFraudDetectionEvent(event(-5)))
                .isInstanceOf(IllegalArgumentException.class);

        verifyNoInteractions(accountServiceClient, kafkaTemplate);
    }

    private static Map<String, Object> event(Number amount) {
        Map<String, Object> event = new HashMap<>();
        event.put("transactionId", "tx-1");
        event.put("senderAccountNumber", SENDER);
        event.put("receiverAccountNumber", RECEIVER);
        event.put("amount", amount);
        event.put("description", "rent");
        return event;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> publishedTo(String topic) {
        ArgumentCaptor<Object> captor = ArgumentCaptor.forClass(Object.class);
        verify(kafkaTemplate).send(eq(topic), eq("tx-1"), captor.capture());
        return (Map<String, Object>) captor.getValue();
    }
}
