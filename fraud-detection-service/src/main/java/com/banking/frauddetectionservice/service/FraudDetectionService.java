package com.banking.frauddetectionservice.service;

import com.banking.frauddetectionservice.client.AccountServiceClient;
import com.banking.frauddetectionservice.config.FraudProperties;
import com.banking.frauddetectionservice.config.KafkaConfig;
import com.banking.frauddetectionservice.model.FraudCheckResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Runs the fraud checks for a {@code transaction.initiated} event and publishes the verdict:
 * {@code fraud.check.clean} or {@code verification.required}.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class FraudDetectionService {

    static final String VELOCITY_KEY_PREFIX = "fraud:velocity:";
    static final String AMOUNT_STATS_KEY_PREFIX = "fraud:amount-stats:";
    static final String STATS_COUNT = "count";
    /** Sum of past transfers in paise (amount x 100) - a long keeps it exact, unlike Redis floats. */
    static final String STATS_SUM_PAISE = "sumPaise";
    private static final Duration VELOCITY_WINDOW = Duration.ofMinutes(1);

    private final AccountServiceClient accountServiceClient;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final StringRedisTemplate redisTemplate;
    private final FraudProperties fraudProperties;

    public void processFraudDetectionEvent(Map<String, Object> payload) {
        String transactionId = requiredText(payload, "transactionId");
        String senderAccountNumber = requiredText(payload, "senderAccountNumber");
        String receiverAccountNumber = requiredText(payload, "receiverAccountNumber");
        BigDecimal amount = requiredAmount(payload, "amount");

        // transaction-service debits the sender BEFORE publishing the event, so this is the balance
        // after the transfer. The balance check needs the balance the money was taken from.
        BigDecimal balanceAfterDebit = accountServiceClient.getBalance(senderAccountNumber);
        BigDecimal balanceBeforeDebit = balanceAfterDebit.add(amount);
        log.info("Checking transaction {}: sender {}, amount {}, balance before transfer {}",
                transactionId, senderAccountNumber, amount, balanceBeforeDebit);

        FraudCheckResult result = performFraudChecks(senderAccountNumber, amount, balanceBeforeDebit);

        Map<String, Object> verdict = new HashMap<>();
        verdict.put("transactionId", transactionId);
        verdict.put("senderAccountNumber", senderAccountNumber);
        verdict.put("receiverAccountNumber", receiverAccountNumber);
        verdict.put("amount", amount);
        verdict.put("fraud", result.fraud());
        verdict.put("reason", result.reason());
        verdict.put("checkedAt", LocalDateTime.now().toString());

        String topic;
        if (result.fraud()) {
            log.warn("Transaction {} flagged for sender {}: {} - requesting verification",
                    transactionId, senderAccountNumber, result.reason());
            topic = KafkaConfig.VERIFICATION_REQUIRED_TOPIC;
        } else {
            log.info("Transaction {} for sender {} is clean", transactionId, senderAccountNumber);
            // Only clean transfers shape the account's "normal" amount.
            recordAmount(senderAccountNumber, amount);
            topic = KafkaConfig.FRAUD_CHECK_CLEAN_TOPIC;
        }
        // join(): a failed publish throws, so the error handler retries instead of the verdict being lost.
        kafkaTemplate.send(topic, transactionId, verdict).join();
    }

    /**
     * <ol>
     *     <li>Velocity: more than {@code fraud.max-transactions-per-minute} transfers from the account in 60 s.</li>
     *     <li>Amount: transfer above (account's average transfer x {@code fraud.suspicious-amount-multiplier}).</li>
     *     <li>Balance: transfer above {@code fraud.max-balance-percentage} of the balance it was taken from.</li>
     *     <li>Geography: not implemented yet - the event carries no location data.</li>
     * </ol>
     */
    FraudCheckResult performFraudChecks(String accountNumber, BigDecimal amount, BigDecimal balanceBeforeDebit) {
        if (isVelocityExceeded(accountNumber)) {
            return FraudCheckResult.flagged("Velocity check failed - more than "
                    + fraudProperties.maxTransactionsPerMinute() + " transactions in one minute");
        }
        if (isAmountSuspicious(accountNumber, amount)) {
            return FraudCheckResult.flagged("Unusual transaction amount - more than "
                    + fraudProperties.suspiciousAmountMultiplier().stripTrailingZeros().toPlainString()
                    + "x the account's average transaction");
        }
        if (isBalanceCheckFailed(balanceBeforeDebit, amount)) {
            return FraudCheckResult.flagged("Transaction exceeds "
                    + fraudProperties.maxBalancePercentage().movePointRight(2).stripTrailingZeros().toPlainString()
                    + "% of the account balance");
        }
        if (isGeographicalSuspicious(accountNumber)) {
            return FraudCheckResult.flagged("Unusual transaction location detected");
        }
        return FraudCheckResult.clean();
    }

    private boolean isVelocityExceeded(String accountNumber) {
        String key = VELOCITY_KEY_PREFIX + accountNumber;
        Long count = redisTemplate.opsForValue().increment(key);
        if (count != null && count == 1) {
            // First transfer in this window: start the 60-second countdown.
            redisTemplate.expire(key, VELOCITY_WINDOW);
        }
        log.debug("Velocity check for account {}: {} transaction(s) in the current minute", accountNumber, count);
        return count != null && count > fraudProperties.maxTransactionsPerMinute();
    }

    private boolean isAmountSuspicious(String accountNumber, BigDecimal amount) {
        HashOperations<String, String, String> hash = redisTemplate.opsForHash();
        Map<String, String> stats = hash.entries(AMOUNT_STATS_KEY_PREFIX + accountNumber);
        long count = Long.parseLong(stats.getOrDefault(STATS_COUNT, "0"));
        if (count == 0) {
            return false; // no history yet - nothing to compare with
        }
        BigDecimal average = new BigDecimal(stats.getOrDefault(STATS_SUM_PAISE, "0"))
                .movePointLeft(2)
                .divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP);
        BigDecimal threshold = average.multiply(fraudProperties.suspiciousAmountMultiplier());
        log.debug("Amount check for account {}: amount {}, average {}, threshold {}",
                accountNumber, amount, average, threshold);
        return amount.compareTo(threshold) > 0;
    }

    private void recordAmount(String accountNumber, BigDecimal amount) {
        String key = AMOUNT_STATS_KEY_PREFIX + accountNumber;
        HashOperations<String, String, String> hash = redisTemplate.opsForHash();
        hash.increment(key, STATS_COUNT, 1);
        hash.increment(key, STATS_SUM_PAISE,
                amount.setScale(2, RoundingMode.HALF_UP).movePointRight(2).longValueExact());
    }

    private boolean isBalanceCheckFailed(BigDecimal balanceBeforeDebit, BigDecimal amount) {
        if (balanceBeforeDebit.signum() <= 0) {
            return false;
        }
        BigDecimal threshold = balanceBeforeDebit.multiply(fraudProperties.maxBalancePercentage());
        log.debug("Balance check: amount {}, balance {}, threshold {}", amount, balanceBeforeDebit, threshold);
        return amount.compareTo(threshold) > 0;
    }

    private boolean isGeographicalSuspicious(String accountNumber) {
        // TODO: needs location data (IP / device / city) in TransactionInitiatedEvent before it can be checked.
        return false;
    }

    private static String requiredText(Map<String, Object> payload, String field) {
        Object value = payload.get(field);
        if (value == null || value.toString().isBlank()) {
            throw new IllegalArgumentException("Event is missing required field '" + field + "'");
        }
        return value.toString();
    }

    /** JSON numbers arrive in a Map as Integer/Long/Double; toString() keeps the exact decimal value. */
    private static BigDecimal requiredAmount(Map<String, Object> payload, String field) {
        String text = requiredText(payload, field);
        BigDecimal amount;
        try {
            amount = new BigDecimal(text);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Event field '" + field + "' is not a number: " + text, e);
        }
        if (amount.signum() <= 0) {
            throw new IllegalArgumentException("Event field '" + field + "' must be positive: " + text);
        }
        return amount;
    }
}
