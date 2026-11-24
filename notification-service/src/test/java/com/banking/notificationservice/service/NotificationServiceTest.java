package com.banking.notificationservice.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;

import java.util.HashMap;
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
    void flaggedTransferAlertsSenderWithReason(CapturedOutput output) {
        service.sendFailedAlertNotification(Map.of("transactionId", "tx-1",
                "senderAccountNumber", SENDER, "receiverAccountNumber", RECEIVER, "amount", 75000,
                "status", "FLAGGED", "reason", "OTP expired (sender refunded)"));

        assertThat(output).contains("to account XXXXXXXX7853 - Transfer of INR 75000.00 cancelled")
                .contains("was cancelled for your security")
                .contains("OTP expired (sender refunded)");
    }

    @Test
    void failedTransferWithoutReceiverStillAlertsSender(CapturedOutput output) {
        Map<String, Object> payload = new HashMap<>(Map.of("transactionId", "tx-1",
                "senderAccountNumber", SENDER, "amount", "120.00", "status", "FAILED",
                "reason", "Could not deduct sender: Insufficient balance"));

        service.sendFailedAlertNotification(payload);

        assertThat(output).contains("Transfer of INR 120.00 failed").contains("could not be completed")
                .contains("Insufficient balance");
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
        assertThatThrownBy(() -> service.sendFailedAlertNotification(Map.of("transactionId", "tx-1",
                "senderAccountNumber", SENDER, "amount", "ten")))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("amount");
    }

    @Test
    void masksAllButLastFourDigits() {
        assertThat(NotificationService.mask("758885717853")).isEqualTo("XXXXXXXX7853");
        assertThat(NotificationService.mask("123")).isEqualTo("123");
    }
}
