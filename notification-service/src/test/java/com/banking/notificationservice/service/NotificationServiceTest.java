package com.banking.notificationservice.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Plain unit test - alerts are only logged for now, so the log output is what we check. */
@ExtendWith(OutputCaptureExtension.class)
class NotificationServiceTest {

    private static final String SENDER = "758885717853";
    private static final String RECEIVER = "755016767385";

    private final NotificationService service = new NotificationService();

    @Test
    void completedTransferAlertsSenderAndReceiver(CapturedOutput output) {
        // amount arrives as a JSON number (Double), not a String
        service.sendCompletedAlertNotification(Map.of("transactionId", "tx-1",
                "senderAccountNumber", SENDER, "receiverAccountNumber", RECEIVER, "amount", 500.5));

        assertThat(output).contains("[ALERT] to account XXXXXXXX7853 - Money sent: INR 500.50")
                .contains("[ALERT] to account XXXXXXXX7385 - Money received: INR 500.50")
                .doesNotContain(SENDER).doesNotContain(RECEIVER);   // full account numbers never logged
    }

    @Test
    void initiatedTransferAlertsSender(CapturedOutput output) {
        service.sendInitiatedAlertNotification(Map.of("transactionId", "tx-1",
                "senderAccountNumber", SENDER, "receiverAccountNumber", RECEIVER, "amount", 500,
                "description", "rent"));

        assertThat(output).contains("to account XXXXXXXX7853 - Transfer of INR 500.00 initiated")
                .contains("is being processed");
    }

    @Test
    void refundedTransferAlertsSenderWithReason(CapturedOutput output) {
        service.sendRefundedAlertNotification(Map.of("transactionId", "tx-1",
                "senderAccountNumber", SENDER, "receiverAccountNumber", RECEIVER, "amount", 75000,
                "reason", "OTP expired (sender refunded)"));

        assertThat(output).contains("to account XXXXXXXX7853 - Refund of INR 75000.00")
                .contains("credited back").contains("OTP expired (sender refunded)");
    }

    @Test
    void fraudDetectedWarnsSenderAboutTheBlock(CapturedOutput output) {
        service.sendFraudAlertNotification(Map.of("transactionId", "tx-1",
                "senderAccountNumber", SENDER, "receiverAccountNumber", RECEIVER, "amount", 75000,
                "reason", "Too many wrong OTP attempts"));

        assertThat(output).contains("to account XXXXXXXX7853 - Security alert: your account has been blocked")
                .contains("Too many wrong OTP attempts");
    }

    @Test
    void paymentCompletedAndFailedAlertTheAccountHolder(CapturedOutput output) {
        service.sendPaymentCompletedAlertNotification(Map.of("paymentId", "p-1", "accountNumber", SENDER,
                "amount", 499.99, "razorpayPaymentId", "pay_123"));
        service.sendPaymentFailedAlertNotification(Map.of("paymentId", "p-2", "accountNumber", SENDER,
                "amount", 100, "reason", "Card declined"));

        assertThat(output).contains("to account XXXXXXXX7853 - Payment of INR 499.99 successful")
                .contains("pay_123")
                .contains("to account XXXXXXXX7853 - Payment of INR 100.00 failed")
                .contains("Card declined");
    }

    @Test
    void otpAlertNeverLogsTheOtp(CapturedOutput output) {
        service.sendAlertNotification(Map.of("transactionId", "tx-1", "senderAccountNumber", SENDER,
                "amount", 75000, "otp", "482913", "reason", "High-value transfer", "expiryMinutes", 5));

        assertThat(output).contains("Confirm your transfer of INR 75000.00").contains("<hidden: contains OTP>")
                .doesNotContain("482913");
    }

    @Test
    void eventWithMissingOrBadFieldsIsRejected() {
        assertThatThrownBy(() -> service.sendCompletedAlertNotification(Map.of("transactionId", "tx-1",
                "receiverAccountNumber", RECEIVER, "amount", 10)))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("senderAccountNumber");
        assertThatThrownBy(() -> service.sendRefundedAlertNotification(Map.of("transactionId", "tx-1",
                "senderAccountNumber", SENDER, "amount", "ten")))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("amount");
        assertThatThrownBy(() -> service.sendPaymentCompletedAlertNotification(Map.of("paymentId", "p-1",
                "amount", 10)))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("accountNumber");
    }

    @Test
    void masksAllButLastFourDigits() {
        assertThat(NotificationService.mask("758885717853")).isEqualTo("XXXXXXXX7853");
        assertThat(NotificationService.mask("123")).isEqualTo("123");
    }
}
