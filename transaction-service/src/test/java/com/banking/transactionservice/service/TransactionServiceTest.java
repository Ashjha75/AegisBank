package com.banking.transactionservice.service;

import com.banking.transactionservice.client.AccountClient;
import com.banking.transactionservice.config.OtpProperties;
import com.banking.transactionservice.dto.TransactionResponse;
import com.banking.transactionservice.dto.TransferRequest;
import com.banking.transactionservice.entity.Transaction;
import com.banking.transactionservice.entity.TransactionStatus;
import com.banking.transactionservice.entity.TransactionType;
import com.banking.transactionservice.exception.DownstreamServiceException;
import com.banking.transactionservice.exception.InvalidOtpException;
import com.banking.transactionservice.exception.InvalidTransactionStateException;
import com.banking.transactionservice.exception.InvalidTransferException;
import com.banking.transactionservice.mapper.TransactionMapper;
import com.banking.transactionservice.repository.TransactionRepository;
import feign.FeignException;
import feign.Request;
import feign.Response;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Plain unit test - no Spring, no database, no running account-service. */
class TransactionServiceTest {

    private static final String SENDER = "123456789012";
    private static final String RECEIVER = "223456789012";
    private static final BigDecimal SMALL = new BigDecimal("500.00");
    private static final BigDecimal BIG = new BigDecimal("75000.00");

    private TransactionRepository repository;
    private AccountClient accountClient;
    private TransactionService service;

    @BeforeEach
    void setUp() {
        repository = mock(TransactionRepository.class);
        accountClient = mock(AccountClient.class);
        when(repository.save(any(Transaction.class))).thenAnswer(inv -> inv.getArgument(0));
        service = new TransactionService(repository, new TransactionMapper(), accountClient,
                new OtpProperties(new BigDecimal("50000"), 5, 3));
    }

    // ------------------------------------------------------------- transfer

    @Test
    void smallTransferDeductsSenderCreditsReceiverAndCompletes() {
        TransactionResponse result = service.transfer(new TransferRequest(SENDER, RECEIVER, SMALL, "rent"));

        assertThat(result.status()).isEqualTo(TransactionStatus.COMPLETED);
        assertThat(result.type()).isEqualTo(TransactionType.TRANSFER);
        assertThat(result.referenceNumber()).startsWith("TXN");
        assertThat(result.completedAt()).isNotNull();
        verify(accountClient).deductBalance(SENDER, SMALL);
        verify(accountClient).creditBalance(RECEIVER, SMALL);
    }

    @Test
    void bigTransferWaitsForOtpWithoutCreditingReceiver() {
        TransactionResponse result = service.transfer(new TransferRequest(SENDER, RECEIVER, BIG, null));

        assertThat(result.status()).isEqualTo(TransactionStatus.PENDING_VERIFICATION);
        verify(accountClient).deductBalance(SENDER, BIG);
        verify(accountClient, never()).creditBalance(anyString(), any());
    }

    @Test
    void refusedDeductFailsTheTransferWithAccountServiceReason() {
        when(accountClient.deductBalance(SENDER, SMALL)).thenThrow(feignError(422,
                "{\"detail\":\"Insufficient balance in account 123456789012\",\"status\":422}"));

        TransactionResponse result = service.transfer(new TransferRequest(SENDER, RECEIVER, SMALL, null));

        assertThat(result.status()).isEqualTo(TransactionStatus.FAILED);
        assertThat(result.failureReason()).contains("Insufficient balance");
        verify(accountClient, never()).creditBalance(anyString(), any());
    }

    @Test
    void accountServiceDownDuringDeductThrows502() {
        when(accountClient.deductBalance(SENDER, SMALL)).thenThrow(feignError(503, ""));

        assertThatThrownBy(() -> service.transfer(new TransferRequest(SENDER, RECEIVER, SMALL, null)))
                .isInstanceOf(DownstreamServiceException.class);
    }

    @Test
    void failedCreditRefundsTheSender() {
        when(accountClient.creditBalance(RECEIVER, SMALL)).thenThrow(feignError(404,
                "{\"detail\":\"Account not found with accountNumber: 223456789012\"}"));

        TransactionResponse result = service.transfer(new TransferRequest(SENDER, RECEIVER, SMALL, null));

        assertThat(result.status()).isEqualTo(TransactionStatus.FAILED);
        assertThat(result.failureReason()).contains("Account not found").contains("sender refunded");
        verify(accountClient).creditBalance(SENDER, SMALL);
    }

    @Test
    void serviceRejectsSameSenderAndReceiverEvenWithoutController() {
        assertThatThrownBy(() -> service.transfer(new TransferRequest(SENDER, SENDER, SMALL, null)))
                .isInstanceOf(InvalidTransferException.class);
    }

    // ------------------------------------------------------------- verifyOTP

    @Test
    void rightOtpCreditsReceiverAndCompletes() {
        Transaction pending = pendingVerification("123456", 0);

        TransactionResponse result = service.verifyOTP("tx-1", "123456");

        assertThat(result.status()).isEqualTo(TransactionStatus.COMPLETED);
        assertThat(pending.getOtpHash()).isNull();
        verify(accountClient).creditBalance(RECEIVER, BIG);
    }

    @Test
    void wrongOtpCountsTheAttemptAndTellsAttemptsLeft() {
        Transaction pending = pendingVerification("123456", 0);

        assertThatThrownBy(() -> service.verifyOTP("tx-1", "000000"))
                .isInstanceOf(InvalidOtpException.class)
                .hasMessageContaining("Attempts left: 2");
        assertThat(pending.getOtpAttempts()).isEqualTo(1);
        verify(accountClient, never()).creditBalance(anyString(), any());
    }

    @Test
    void lastWrongOtpFlagsTransferAndRefundsSender() {
        pendingVerification("123456", 2);

        TransactionResponse result = service.verifyOTP("tx-1", "000000");

        assertThat(result.status()).isEqualTo(TransactionStatus.FLAGGED);
        verify(accountClient).creditBalance(SENDER, BIG);
        verify(accountClient, never()).creditBalance(RECEIVER, BIG);
    }

    @Test
    void expiredOtpFlagsTransferAndRefundsSender() {
        Transaction pending = pendingVerification("123456", 0);
        pending.setOtpExpiresAt(LocalDateTime.now().minusMinutes(1));

        TransactionResponse result = service.verifyOTP("tx-1", "123456");

        assertThat(result.status()).isEqualTo(TransactionStatus.FLAGGED);
        verify(accountClient).creditBalance(SENDER, BIG);
    }

    @Test
    void cannotVerifyACompletedTransfer() {
        Transaction done = pendingVerification("123456", 0);
        done.setStatus(TransactionStatus.COMPLETED);

        assertThatThrownBy(() -> service.verifyOTP("tx-1", "123456"))
                .isInstanceOf(InvalidTransactionStateException.class);
    }

    // ------------------------------------------------------------- helpers

    private Transaction pendingVerification(String otp, int attempts) {
        Transaction transaction = Transaction.builder()
                .id("tx-1").senderAccountNumber(SENDER).receiverAccountNumber(RECEIVER).amount(BIG)
                .type(TransactionType.TRANSFER).status(TransactionStatus.PENDING_VERIFICATION)
                .referenceNumber("TXN1").otpHash(sha256(otp)).otpAttempts(attempts)
                .otpExpiresAt(LocalDateTime.now().plusMinutes(5))
                .build();
        when(repository.findByIdForUpdate("tx-1")).thenReturn(Optional.of(transaction));
        return transaction;
    }

    private static String sha256(String value) {
        try {
            return HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private static FeignException feignError(int status, String body) {
        Request request = Request.create(Request.HttpMethod.PUT, "http://account-service/internal",
                Map.of(), null, StandardCharsets.UTF_8, null);
        Response response = Response.builder().status(status).reason("error").request(request)
                .headers(Map.of()).body(body, StandardCharsets.UTF_8).build();
        return FeignException.errorStatus("AccountClient#call", response);
    }
}
