package com.banking.transactionservice.service;

import com.banking.transactionservice.client.AccountClient;
import com.banking.transactionservice.config.KafkaConfig;
import com.banking.transactionservice.config.OtpProperties;
import com.banking.transactionservice.dto.TransactionResponse;
import com.banking.transactionservice.dto.TransferRequest;
import com.banking.transactionservice.entity.Transaction;
import com.banking.transactionservice.entity.TransactionStatus;
import com.banking.transactionservice.entity.TransactionType;
import com.banking.transactionservice.event.TransactionInitiatedEvent;
import com.banking.transactionservice.exception.*;
import com.banking.transactionservice.mapper.TransactionMapper;
import com.banking.transactionservice.repository.TransactionRepository;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Money transfer SAGA between two accounts (both owned by account-service):
 * <pre>
 *  transfer():
 *   1. save transaction PENDING
 *   2. deduct sender            -> fails: FAILED (nothing moved)
 *   3. status PROCESSING, publish transaction.initiated for fraud-detection-service, return PROCESSING
 *
 *  fraud-detection-service answers (TransactionEventConsumer):
 *   fraud.check.clean      -> amount >= OTP threshold: PENDING_VERIFICATION (OTP sent)
 *                             otherwise: credit receiver -> COMPLETED (fails: refund sender, FAILED)
 *   verification.required  -> PENDING_VERIFICATION (OTP sent)
 *
 *  verifyOTP(): right OTP -> credit receiver;  expired / too many wrong OTPs -> refund sender, FLAGGED
 * </pre>
 * Feign calls are not wrapped in one big DB transaction: every status change is saved straight away,
 * so the table always shows how far the SAGA got.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TransactionService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final DateTimeFormatter REFERENCE_TIME = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    /**
     * Pulls "detail" out of account-service's RFC 9457 error body, e.g. "Insufficient balance ...".
     */
    private static final Pattern PROBLEM_DETAIL = Pattern.compile("\"detail\"\\s*:\\s*\"([^\"]*)\"");


    // Topic names must match the consumers exactly - no spaces.
    private static final String TRANSACTION_INITIATED_TOPIC = "transaction.initiated";
    private static final String TRANSACTION_COMPLETED_TOPIC = "transaction.completed";
    private static final String TRANSACTION_REFUNDED_TOPIC = "transaction.refunded";

    private final TransactionRepository transactionRepository;
    private final TransactionMapper transactionMapper;
    private final AccountClient accountClient;
    private final OtpProperties otpProperties;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final OtpService otpService;

    /**
     * SAGA STEP -
     * <pre>
     *      1: Initiate transfer
     *      2: Deducts from sender via feign
     *      3: Saves transaction as PROCESSING.
     *      4: Publish event to kafka for fraud check
     *      5: Returns. The rest happens when fraud-detection-service answers (see handleFraudCheckClean /
     *         handleVerificationRequired).
     * </pre>
     * @param request
     * @return
     */
    public TransactionResponse transfer(TransferRequest request) {

        validate(request);

        Transaction transaction = transactionMapper.toEntity(request);
        transaction.setType(TransactionType.TRANSFER);
        transaction.setStatus(TransactionStatus.PENDING);
        transaction.setReferenceNumber(newReferenceNumber());
        transaction = transactionRepository.save(transaction);
        log.info("Transfer {} started: {} -> {}, amount {}", transaction.getReferenceNumber(),
                transaction.getSenderAccountNumber(), transaction.getReceiverAccountNumber(), transaction.getAmount());

        // SAGA step 1: take the money from the sender
        try {
            accountClient.deductBalance(transaction.getSenderAccountNumber(), transaction.getAmount());
        } catch (FeignException e) {
            markFailed(transaction, "Could not deduct sender: " + reason(e));
            if (isServerSide(e)) {
                throw new DownstreamServiceException("account-service", "deduct balance", e);
            }
            return transactionMapper.toResponse(transaction);
        }
        transaction.setStatus(TransactionStatus.PROCESSING);
        transaction = transactionRepository.save(transaction);
        log.info("Transfer {} saved as PROCESSING", transaction.getReferenceNumber());

        // SAGA step 2: publish for fraud check (fraud-detection-service reads transaction.initiated).
        // The receiver is credited only after fraud-detection-service answers.
        publishTransactionInitiated(transaction);

        return transactionMapper.toResponse(transaction);
    }

    /**
     * Fire-and-forget: the sender is already debited and the transaction is saved as PROCESSING,
     * so a Kafka problem must not fail the request. It is logged so the transfer can be re-published.
     */
    private void publishTransactionInitiated(Transaction transaction) {
        TransactionInitiatedEvent event = new TransactionInitiatedEvent(
                transaction.getId(),
                transaction.getSenderAccountNumber(),
                transaction.getReceiverAccountNumber(),
                transaction.getAmount(),
                transaction.getDescription(),
                LocalDateTime.now());
        try {
            kafkaTemplate.send(TRANSACTION_INITIATED_TOPIC, transaction.getId(), event)
                    .whenComplete((result, ex) -> {
                        if (ex != null) {
                            log.error("Transfer {}: could not publish {} - re-publish it later",
                                    transaction.getReferenceNumber(), TRANSACTION_INITIATED_TOPIC, ex);
                        } else {
                            log.info("SAGA step 2 - TransactionInitiatedEvent published for transfer {} (id {})",
                                    transaction.getReferenceNumber(), transaction.getId());
                        }
                    });
        } catch (RuntimeException ex) {
            // e.g. Kafka unreachable for max.block.ms (5 s)
            log.error("Transfer {}: could not publish {} - re-publish it later",
                    transaction.getReferenceNumber(), TRANSACTION_INITIATED_TOPIC, ex);
        }
    }

    @Transactional(readOnly = true)
    public TransactionResponse getTransaction(String transactionId) {
        return transactionRepository.findById(transactionId)
                .map(transactionMapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction", "id", transactionId));
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> getTransactionHistory(String accountNumber) {
        return transactionRepository
                .findBySenderAccountNumberOrReceiverAccountNumberOrderByCreatedAtDesc(accountNumber, accountNumber)
                .stream()
                .map(transactionMapper::toResponse)
                .toList();
    }

    // ---------------------------------------------------------------- fraud-detection answers

    /**
     * fraud.check.clean: the fraud checks passed. High-value transfers still need an OTP;
     * everything else credits the receiver straight away.
     */
    @Transactional
    public void handleFraudCheckClean(String transactionId) {
        Transaction transaction = lockProcessing(transactionId, "fraud.check.clean");
        if (transaction == null) {
            return;
        }
        if (transaction.getAmount().compareTo(otpProperties.threshold()) >= 0) {
            requestOtp(transaction, "High-value transfer");
            return;
        }
        creditReceiver(transaction);
    }

    /** verification.required: fraud-detection-service flagged the transfer - the sender must confirm it by OTP. */
    @Transactional
    public void handleVerificationRequired(String transactionId, String reason) {
        Transaction transaction = lockProcessing(transactionId, "verification.required");
        if (transaction == null) {
            return;
        }
        requestOtp(transaction, reason == null ? "Suspicious activity" : reason);
    }

    /**
     * Loads and locks the transaction. Returns null when it is no longer PROCESSING: Kafka can deliver an
     * event twice, and the second delivery must not issue a second OTP or credit the receiver twice.
     */
    private Transaction lockProcessing(String transactionId, String event) {
        Transaction transaction = transactionRepository.findByIdForUpdate(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction", "id", transactionId));
        if (transaction.getStatus() != TransactionStatus.PROCESSING) {
            log.info("Transfer {}: ignoring {} - status is already {}",
                    transaction.getReferenceNumber(), event, transaction.getStatus());
            return null;
        }
        return transaction;
    }

    // ---------------------------------------------------------------- OTP

    /**
     * Confirms a PENDING_VERIFICATION transfer. The row is locked so two parallel calls can't both credit
     * the receiver. A wrong OTP still saves the attempt count (noRollbackFor) before telling the client.
     */
    @Transactional(noRollbackFor = InvalidOtpException.class)
    public TransactionResponse verifyOTP(String transactionId, String otp) {
        Transaction transaction = transactionRepository.findByIdForUpdate(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction", "id", transactionId));

        if (transaction.getStatus() != TransactionStatus.PENDING_VERIFICATION) {
            throw new InvalidTransactionStateException(transactionId, transaction.getStatus(), "verify OTP");
        }

        switch (otpService.verify(transactionId, otp)) {
            case EXPIRED -> {
                return flagAndRefund(transaction, "OTP expired");
            }
            case WRONG -> {
                transaction.setOtpAttempts(transaction.getOtpAttempts() + 1);
                int attemptsLeft = otpProperties.maxAttempts() - transaction.getOtpAttempts();
                if (attemptsLeft <= 0) {
                    return flagAndRefund(transaction, "Too many wrong OTP attempts");
                }
                transactionRepository.save(transaction);
                throw new InvalidOtpException(attemptsLeft);
            }
            case VALID -> {
                log.info("Transfer {} verified by OTP", transaction.getReferenceNumber());
                return creditReceiver(transaction);
            }
        }
        throw new IllegalStateException("Unhandled OTP result");
    }

    /**
     * Puts the transfer on hold and sends the sender an OTP (via notification-service).
     * The publish waits for Kafka: if it fails, the exception rolls the status back and the
     * Kafka error handler retries the event, which issues a fresh OTP.
     */
    private void requestOtp(Transaction transaction, String reason) {
        String otp = otpService.generate(transaction.getId());
        transaction.setStatus(TransactionStatus.PENDING_VERIFICATION);
        transaction.setOtpAttempts(0);
        transactionRepository.save(transaction);

        Map<String, Object> event = new HashMap<>();
        event.put("transactionId", transaction.getId());
        event.put("referenceNumber", transaction.getReferenceNumber());
        event.put("senderAccountNumber", transaction.getSenderAccountNumber());
        event.put("amount", transaction.getAmount());
        event.put("reason", reason);
        event.put("otp", otp);
        event.put("expiryMinutes", otpProperties.expiryMinutes());
        kafkaTemplate.send(KafkaConfig.OTP_GENERATED_TOPIC, transaction.getId(), event).join();
        // Never log the OTP itself.
        log.info("Transfer {} waiting for OTP verification ({})", transaction.getReferenceNumber(), reason);
    }

    // ---------------------------------------------------------------- SAGA steps

    /**
     * SAGA step 2: give the money to the receiver; refund the sender if that fails.
     */
    private TransactionResponse creditReceiver(Transaction transaction) {
        try {
            accountClient.creditBalance(transaction.getReceiverAccountNumber(), transaction.getAmount());
        } catch (FeignException e) {
            String reason = "Could not credit receiver: " + reason(e);
            markFailed(transaction, refundSender(transaction) ? reason + " (sender refunded)"
                    : reason + " (sender refund FAILED - needs manual check)");
            return transactionMapper.toResponse(transaction);
        }
        transaction.setStatus(TransactionStatus.COMPLETED);
        transaction.setCompletedAt(LocalDateTime.now());
        log.info("Transfer {} completed", transaction.getReferenceNumber());
        return transactionMapper.toResponse(transactionRepository.save(transaction));
    }

    /**
     * Compensating step: give the deducted amount back to the sender. Returns false if that failed too.
     */
    private boolean refundSender(Transaction transaction) {
        try {
            accountClient.creditBalance(transaction.getSenderAccountNumber(), transaction.getAmount());
            log.info("Transfer {}: sender refunded", transaction.getReferenceNumber());
            return true;
        } catch (FeignException e) {
            log.error("Transfer {}: REFUND TO SENDER {} FAILED ({}) - needs manual check",
                    transaction.getReferenceNumber(), transaction.getSenderAccountNumber(), reason(e), e);
            return false;
        }
    }

    private TransactionResponse flagAndRefund(Transaction transaction, String reason) {
        otpService.delete(transaction.getId());
        transaction.setStatus(TransactionStatus.FLAGGED);
        transaction.setFailureReason(refundSender(transaction) ? reason + " (sender refunded)"
                : reason + " (sender refund FAILED - needs manual check)");
        log.warn("Transfer {} flagged: {}", transaction.getReferenceNumber(), transaction.getFailureReason());
        return transactionMapper.toResponse(transactionRepository.save(transaction));
    }

    private void markFailed(Transaction transaction, String reason) {
        transaction.setStatus(TransactionStatus.FAILED);
        transaction.setFailureReason(reason);
        transactionRepository.save(transaction);
        log.warn("Transfer {} failed: {}", transaction.getReferenceNumber(), reason);
    }

    // ---------------------------------------------------------------- helpers

    /**
     * Same rules as TransferRequest's Bean Validation - repeated here because Kafka events skip controllers.
     */
    private static void validate(TransferRequest request) {
        if (request.amount() == null || request.amount().signum() <= 0) {
            throw new InvalidTransferException("Amount must be greater than zero");
        }
        if (request.senderAccountNumber() == null
                || request.senderAccountNumber().equals(request.receiverAccountNumber())) {
            throw new InvalidTransferException("Sender and receiver accounts must be different");
        }
    }

    /**
     * e.g. TXN20261121143005-4821
     */
    private static String newReferenceNumber() {
        return "TXN" + LocalDateTime.now().format(REFERENCE_TIME) + "-" + "%04d".formatted(RANDOM.nextInt(10_000));
    }

    /**
     * 5xx or no response at all (status -1): account-service broke, not a business "no".
     */
    private static boolean isServerSide(FeignException e) {
        return e.status() < 0 || e.status() >= 500;
    }

    private static String reason(FeignException e) {
        if (e.status() < 0) {
            return "account-service unreachable";
        }
        Matcher detail = PROBLEM_DETAIL.matcher(e.contentUTF8());
        return detail.find() ? detail.group(1) : "account-service returned HTTP " + e.status();
    }
}
