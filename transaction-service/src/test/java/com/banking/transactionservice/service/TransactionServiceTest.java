package com.banking.transactionservice.service;

import com.banking.transactionservice.client.AccountClient;
import com.banking.transactionservice.config.OtpProperties;
import com.banking.transactionservice.dto.TransactionResponse;
import com.banking.transactionservice.dto.TransferRequest;
import com.banking.transactionservice.entity.Transaction;
import com.banking.transactionservice.entity.TransactionStatus;
import com.banking.transactionservice.entity.TransactionType;
import com.banking.transactionservice.event.TransactionCompletedEvent;
import com.banking.transactionservice.event.TransactionInitiatedEvent;
import com.banking.transactionservice.exception.DownstreamServiceException;
import com.banking.transactionservice.exception.InvalidOtpException;
import com.banking.transactionservice.exception.InvalidTransactionStateException;
import com.banking.transactionservice.exception.InvalidTransferException;
import com.banking.transactionservice.exception.ResourceNotFoundException;
import com.banking.transactionservice.mapper.TransactionMapper;
import com.banking.transactionservice.repository.TransactionRepository;
import feign.FeignException;
import feign.Request;
import feign.Response;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.kafka.KafkaException;
import org.springframework.kafka.core.KafkaTemplate;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/** Plain unit test - no Spring, no database, no running account-service. */
class TransactionServiceTest {

    private static final String SENDER = "123456789012";
    private static final String RECEIVER = "223456789012";
    private static final BigDecimal SMALL = new BigDecimal("500.00");
    private static final BigDecimal BIG = new BigDecimal("75000.00");

    private TransactionRepository repository;
    private AccountClient accountClient;
    private KafkaTemplate<String, Object> kafkaTemplate;
    private OtpService otpService;
    private TransactionService service;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        repository = mock(TransactionRepository.class);
        accountClient = mock(AccountClient.class);
        kafkaTemplate = mock(KafkaTemplate.class);
        otpService = mock(OtpService.class);
        when(otpService.generate(anyString())).thenReturn("654321");
        when(repository.save(any(Transaction.class))).thenAnswer(inv -> inv.getArgument(0));
        when(kafkaTemplate.send(anyString(), any(), any())).thenReturn(CompletableFuture.completedFuture(null));
        service = new TransactionService(repository, new TransactionMapper(), accountClient,
                new OtpProperties(new BigDecimal("50000"), 5, 3), kafkaTemplate, otpService);
    }

    // ------------------------------------------------------------- transfer

    @Test
    void transferDeductsSenderPublishesFraudCheckEventAndStaysProcessing() {
        TransactionResponse result = service.transfer(new TransferRequest(SENDER, RECEIVER, SMALL, "rent"));

        assertThat(result.status()).isEqualTo(TransactionStatus.PROCESSING);
        assertThat(result.type()).isEqualTo(TransactionType.TRANSFER);
        assertThat(result.referenceNumber()).startsWith("TXN");
        verify(accountClient).deductBalance(SENDER, SMALL);
        // receiver is NOT credited until the fraud check answers
        verify(accountClient, never()).creditBalance(anyString(), any());

        ArgumentCaptor<Object> event = ArgumentCaptor.forClass(Object.class);
        verify(kafkaTemplate).send(eq("transaction.initiated"), any(), event.capture());
        assertThat(event.getValue()).isInstanceOfSatisfying(TransactionInitiatedEvent.class, e -> {
            assertThat(e.senderAccountNumber()).isEqualTo(SENDER);
            assertThat(e.receiverAccountNumber()).isEqualTo(RECEIVER);
            assertThat(e.amount()).isEqualByComparingTo(SMALL);
            assertThat(e.description()).isEqualTo("rent");
            assertThat(e.initiatedAt()).isNotNull();
        });
    }

    @Test
    void bigTransferAlsoStaysProcessingUntilFraudCheckAnswers() {
        TransactionResponse result = service.transfer(new TransferRequest(SENDER, RECEIVER, BIG, null));

        assertThat(result.status()).isEqualTo(TransactionStatus.PROCESSING);
        verify(accountClient).deductBalance(SENDER, BIG);
        verify(accountClient, never()).creditBalance(anyString(), any());
    }

    @Test
    void kafkaDownDoesNotFailTheTransfer() {
        when(kafkaTemplate.send(anyString(), any(), any())).thenThrow(new KafkaException("broker not available"));

        TransactionResponse result = service.transfer(new TransferRequest(SENDER, RECEIVER, SMALL, null));

        assertThat(result.status()).isEqualTo(TransactionStatus.PROCESSING);
    }

    @Test
    void failedKafkaSendIsOnlyLogged() {
        when(kafkaTemplate.send(anyString(), any(), any()))
                .thenReturn(CompletableFuture.failedFuture(new KafkaException("timeout")));

        TransactionResponse result = service.transfer(new TransferRequest(SENDER, RECEIVER, SMALL, null));

        assertThat(result.status()).isEqualTo(TransactionStatus.PROCESSING);
    }

    @Test
    void refusedDeductFailsTheTransferWithAccountServiceReason() {
        when(accountClient.deductBalance(SENDER, SMALL)).thenThrow(feignError(422,
                "{\"detail\":\"Insufficient balance in account 123456789012\",\"status\":422}"));

        TransactionResponse result = service.transfer(new TransferRequest(SENDER, RECEIVER, SMALL, null));

        assertThat(result.status()).isEqualTo(TransactionStatus.FAILED);
        assertThat(result.failureReason()).contains("Insufficient balance");
        verify(accountClient, never()).creditBalance(anyString(), any());
        verifyNoInteractions(kafkaTemplate);
    }

    @Test
    void accountServiceDownDuringDeductThrows502() {
        when(accountClient.deductBalance(SENDER, SMALL)).thenThrow(feignError(503, ""));

        assertThatThrownBy(() -> service.transfer(new TransferRequest(SENDER, RECEIVER, SMALL, null)))
                .isInstanceOf(DownstreamServiceException.class);
    }

    @Test
    void failedCreditRefundsTheSender() {
        // credit only happens via verifyOTP while the transfer() credit step is disabled
        pendingVerification(0);
        when(otpService.verify("tx-1", "123456")).thenReturn(OtpService.Result.VALID);
        when(accountClient.creditBalance(RECEIVER, BIG)).thenThrow(feignError(404,
                "{\"detail\":\"Account not found with accountNumber: 223456789012\"}"));

        TransactionResponse result = service.verifyOTP("tx-1", "123456");

        assertThat(result.status()).isEqualTo(TransactionStatus.FAILED);
        assertThat(result.failureReason()).contains("Account not found").contains("sender refunded");
        verify(accountClient).creditBalance(SENDER, BIG);
        verify(kafkaTemplate, never()).send(eq("transaction.completed"), any(), any());
    }

    @Test
    void serviceRejectsSameSenderAndReceiverEvenWithoutController() {
        assertThatThrownBy(() -> service.transfer(new TransferRequest(SENDER, SENDER, SMALL, null)))
                .isInstanceOf(InvalidTransferException.class);
    }

    // ------------------------------------------------------------- fraud-detection answers

    @Test
    void cleanSmallTransferCreditsReceiverAndCompletes() {
        Transaction transaction = processing(SMALL);

        service.handleFraudCheckClean("tx-1");

        assertThat(transaction.getStatus()).isEqualTo(TransactionStatus.COMPLETED);
        verify(accountClient).creditBalance(RECEIVER, SMALL);
        verify(otpService, never()).generate(anyString());

        ArgumentCaptor<Object> event = ArgumentCaptor.forClass(Object.class);
        verify(kafkaTemplate).send(eq("transaction.completed"), eq("tx-1"), event.capture());
        assertThat(event.getValue()).isInstanceOfSatisfying(TransactionCompletedEvent.class, e -> {
            assertThat(e.transactionId()).isEqualTo("tx-1");
            assertThat(e.senderAccountNumber()).isEqualTo(SENDER);
            assertThat(e.receiverAccountNumber()).isEqualTo(RECEIVER);
            assertThat(e.amount()).isEqualByComparingTo(SMALL);
            assertThat(e.completedAt()).isNotNull();
        });
    }

    @Test
    void kafkaDownAfterCreditStillCompletesTheTransfer() {
        Transaction transaction = processing(SMALL);
        when(kafkaTemplate.send(eq("transaction.completed"), any(), any()))
                .thenThrow(new KafkaException("broker not available"));

        service.handleFraudCheckClean("tx-1");

        assertThat(transaction.getStatus()).isEqualTo(TransactionStatus.COMPLETED);
    }

    @Test
    @SuppressWarnings("unchecked")
    void cleanHighValueTransferStillNeedsOtp() {
        Transaction transaction = processing(BIG);

        service.handleFraudCheckClean("tx-1");

        assertThat(transaction.getStatus()).isEqualTo(TransactionStatus.PENDING_VERIFICATION);
        verify(accountClient, never()).creditBalance(anyString(), any());
        ArgumentCaptor<Object> event = ArgumentCaptor.forClass(Object.class);
        verify(kafkaTemplate).send(eq("transaction.otp.generated"), eq("tx-1"), event.capture());
        assertThat((Map<String, Object>) event.getValue())
                .containsEntry("otp", "654321")
                .containsEntry("senderAccountNumber", SENDER)
                .containsEntry("reason", "High-value transfer");
    }

    @Test
    void verificationRequiredIssuesOtpWithFraudReason() {
        Transaction transaction = processing(SMALL);

        service.handleVerificationRequired("tx-1", "Velocity check failed");

        assertThat(transaction.getStatus()).isEqualTo(TransactionStatus.PENDING_VERIFICATION);
        assertThat(transaction.getOtpAttempts()).isZero();
        verify(otpService).generate("tx-1");
        verify(kafkaTemplate).send(eq("transaction.otp.generated"), eq("tx-1"), any());
        verify(accountClient, never()).creditBalance(anyString(), any());
    }

    @Test
    void duplicateFraudEventIsIgnored() {
        Transaction transaction = processing(SMALL);
        transaction.setStatus(TransactionStatus.COMPLETED);

        service.handleFraudCheckClean("tx-1");
        service.handleVerificationRequired("tx-1", "x");

        verifyNoInteractions(accountClient, otpService);
    }

    @Test
    void fraudEventForUnknownTransactionFails() {
        when(repository.findByIdForUpdate("nope")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.handleFraudCheckClean("nope"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ------------------------------------------------------------- verifyOTP

    @Test
    void rightOtpCreditsReceiverAndCompletes() {
        pendingVerification(0);
        when(otpService.verify("tx-1", "123456")).thenReturn(OtpService.Result.VALID);

        TransactionResponse result = service.verifyOTP("tx-1", "123456");

        assertThat(result.status()).isEqualTo(TransactionStatus.COMPLETED);
        verify(accountClient).creditBalance(RECEIVER, BIG);
    }

    @Test
    void wrongOtpCountsTheAttemptAndTellsAttemptsLeft() {
        Transaction pending = pendingVerification(0);
        when(otpService.verify("tx-1", "000000")).thenReturn(OtpService.Result.WRONG);

        assertThatThrownBy(() -> service.verifyOTP("tx-1", "000000"))
                .isInstanceOf(InvalidOtpException.class)
                .hasMessageContaining("Attempts left: 2");
        assertThat(pending.getOtpAttempts()).isEqualTo(1);
        verify(accountClient, never()).creditBalance(anyString(), any());
    }

    @Test
    void lastWrongOtpFlagsTransferAndRefundsSender() {
        pendingVerification(2);
        when(otpService.verify("tx-1", "000000")).thenReturn(OtpService.Result.WRONG);

        TransactionResponse result = service.verifyOTP("tx-1", "000000");

        assertThat(result.status()).isEqualTo(TransactionStatus.FLAGGED);
        verify(accountClient).creditBalance(SENDER, BIG);
        verify(accountClient, never()).creditBalance(RECEIVER, BIG);
        verify(otpService).delete("tx-1");
    }

    @Test
    void expiredOtpFlagsTransferAndRefundsSender() {
        pendingVerification(0);
        when(otpService.verify("tx-1", "123456")).thenReturn(OtpService.Result.EXPIRED);

        TransactionResponse result = service.verifyOTP("tx-1", "123456");

        assertThat(result.status()).isEqualTo(TransactionStatus.FLAGGED);
        assertThat(result.failureReason()).contains("OTP expired");
        verify(accountClient, times(1)).creditBalance(SENDER, BIG);
    }

    @Test
    void cannotVerifyACompletedTransfer() {
        Transaction done = pendingVerification(0);
        done.setStatus(TransactionStatus.COMPLETED);

        assertThatThrownBy(() -> service.verifyOTP("tx-1", "123456"))
                .isInstanceOf(InvalidTransactionStateException.class);
        verifyNoInteractions(otpService);
    }

    // ------------------------------------------------------------- helpers

    private Transaction pendingVerification(int attempts) {
        Transaction transaction = Transaction.builder()
                .id("tx-1").senderAccountNumber(SENDER).receiverAccountNumber(RECEIVER).amount(BIG)
                .type(TransactionType.TRANSFER).status(TransactionStatus.PENDING_VERIFICATION)
                .referenceNumber("TXN1").otpAttempts(attempts)
                .build();
        when(repository.findByIdForUpdate("tx-1")).thenReturn(Optional.of(transaction));
        return transaction;
    }

    private Transaction processing(BigDecimal amount) {
        Transaction transaction = Transaction.builder()
                .id("tx-1").senderAccountNumber(SENDER).receiverAccountNumber(RECEIVER).amount(amount)
                .type(TransactionType.TRANSFER).status(TransactionStatus.PROCESSING)
                .referenceNumber("TXN1")
                .build();
        when(repository.findByIdForUpdate("tx-1")).thenReturn(Optional.of(transaction));
        return transaction;
    }

    private static FeignException feignError(int status, String body) {
        Request request = Request.create(Request.HttpMethod.PUT, "http://account-service/internal",
                Map.of(), null, StandardCharsets.UTF_8, null);
        Response response = Response.builder().status(status).reason("error").request(request)
                .headers(Map.of()).body(body, StandardCharsets.UTF_8).build();
        return FeignException.errorStatus("AccountClient#call", response);
    }
}
