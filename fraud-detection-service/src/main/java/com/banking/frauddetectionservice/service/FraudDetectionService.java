package com.banking.frauddetectionservice.service;

import com.banking.frauddetectionservice.client.AccountServiceClient;
import com.banking.frauddetectionservice.model.FraudCheckResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
@RequiredArgsConstructor
public class FraudDetectionService {

    private final AccountServiceClient accountServiceClient;
    private static final String VERIFICATION_REQUIRED_TOPIC = "verification.required";
    private static final String FRAUD_CHECK_CLEAN_RESULT_TOPIC = "fraud.check.clean";
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final RedisTemplate<String, String> redisTemplate;

    @Value("${fraud.max.transactions.per.minute}")
    private final int MAX_TRANSACTIONS_PER_MINUTE;

    public void processFraudDetectionEvent(Map<String, Object> payload) {
        String transactionId = (String) payload.get("transactionId");
        String accountId = (String) payload.get("accountId");
        BigDecimal amount = new BigDecimal((String) payload.get("amount"));
        log.info("Processing fraud detection event: {}", transactionId);

        // Fetch the account balance using AccountService

        BigDecimal accountBalance = accountServiceClient.getBalance(accountId);
        log.info("Checking transaction: {} for account: {}, amount: {}, balance: {}", transactionId, accountId, amount, accountBalance);

        FraudCheckResult fraudCheckResult = performFraudChecks(accountId, amount, accountBalance);
        if (fraudCheckResult.isFraud()) {
            log.info("Suspicious activity detected for account: {}. reason: {} requesting OTP verification.", accountId, fraudCheckResult.getReason());
            Map<String, Object> verificationEvent = new HashMap<>();
            verificationEvent.put("transactionId", transactionId);
            verificationEvent.put("isFraud", true);
            verificationEvent.put("reason", fraudCheckResult.getReason());

            kafkaTemplate.send(VERIFICATION_REQUIRED_TOPIC, verificationEvent);
        } else {
            log.info("Transaction: {} for account: {} is clean. ", transactionId, accountId);
            Map<String, Object> cleanResultEvent = new HashMap<>();
            cleanResultEvent.put("transactionId", transactionId);
            cleanResultEvent.put("isFraud", false);
            cleanResultEvent.put("reason", null);
            kafkaTemplate.send(FRAUD_CHECK_CLEAN_RESULT_TOPIC, cleanResultEvent);
        }

    }

    /**
     * <Pre>
     *     <ul>
     *         <li>Pattern 1st- Velocity Check: If many transactions are happening in a short span of time, it can be considered as suspicious activity.</li>
     *     </ul>
     * </Pre>
     */
    private FraudCheckResult performFraudChecks(String accountId, BigDecimal amount, BigDecimal accountBalance) {
        // Pattern  1: Velocity Check
        if (isVelocityExceeded(accountId)) {
            return new FraudCheckResult(true, "Velocity check failed-Too many transactions in a short span of time");
        }

        // Pattern 2: Amount Check
        if (isAmountSuspicious(amount, accountBalance)) {
            return new FraudCheckResult(true, "Unusual transaction amount detected-Exceeds 3X the average transaction amount");
        }

        //Pattern 3: Balance Check
        if (accountBalance.compareTo(BigDecimal.ZERO) > 0 && isBalanceCheckFailed(accountBalance, amount)) {
            return new FraudCheckResult(true, "Transaction exceeded 90% of the account balance");
        }
        // Pattern 4: Geographical Check
        if (isGeographicalSuspicious(accountId)) {
            return new FraudCheckResult(true, "Unusual transaction location detected");
        }

        return new FraudCheckResult();
    }

    private boolean isGeographicalSuspicious(String accountId) {
        // Implementation for geographical check
        return false;
    }

    private boolean isAmountSuspicious(BigDecimal amount, BigDecimal accountBalance) {
    }

    private boolean isVelocityExceeded(String accountId) {
        String key = "fraud:velocity:" + accountId;
        Long count = redisTemplate.opsForValue().increment(key);

        if (count != null && count == 1) {
            redisTemplate.expire(key, 60, TimeUnit.SECONDS);
        }
        log.info("Velocity check for account: {}, transaction count in last minute: {}", accountId, count);
        return count != null && count > MAX_TRANSACTIONS_PER_MINUTE;
    }
}
