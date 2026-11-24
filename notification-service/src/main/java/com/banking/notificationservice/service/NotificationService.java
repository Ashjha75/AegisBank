package com.banking.notificationservice.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;

/**
 * Builds the customer alerts for transaction events and hands them to {@link #sendAlert}.
 * <p>
 * Payloads are Maps read from JSON: numbers arrive as Integer/Double, so values are read via toString()
 * (a cast like {@code (String) payload.get("amount")} would throw).
 */
@Service
@Slf4j
public class NotificationService {

    /** OTP for a transfer that needs the sender's confirmation (event: transaction.otp.generated). */
    public void sendAlertNotification(Map<String, Object> payload) {
        String accountNumber = requiredText(payload, "senderAccountNumber");
        String transactionId = requiredText(payload, "transactionId");
        String otp = requiredText(payload, "otp");
        String amount = formatAmount(payload);
        String reason = optionalText(payload, "reason", "Verification required");
        String expiryMinutes = optionalText(payload, "expiryMinutes", "5");
        log.info("Sending OTP alert to account {} for transaction {}", mask(accountNumber), transactionId);

        sendAlert(accountNumber, "Confirm your transfer of " + amount,
                String.format("A transfer of %s from your account %s is waiting for your confirmation. "
                                + "Reason: %s. Your OTP is %s, valid for %s minutes. "
                                + "If this wasn't you, do not share the OTP - the transfer will be cancelled "
                                + "and refunded.",
                        amount, mask(accountNumber), reason, otp, expiryMinutes),
                true);
    }

    /** Transfer done (event: transaction.completed): debit alert to the sender, credit alert to the receiver. */
    public void sendCompletedAlertNotification(Map<String, Object> payload) {
        String transactionId = requiredText(payload, "transactionId");
        String sender = requiredText(payload, "senderAccountNumber");
        String receiver = requiredText(payload, "receiverAccountNumber");
        String amount = formatAmount(payload);
        log.info("Sending completed alerts for transaction {}", transactionId);

        sendAlert(sender, "Money sent: " + amount,
                String.format("%s has been debited from your account %s and sent to account %s. Transaction id: %s.",
                        amount, mask(sender), mask(receiver), transactionId),
                false);
        sendAlert(receiver, "Money received: " + amount,
                String.format("%s has been credited to your account %s from account %s. Transaction id: %s.",
                        amount, mask(receiver), mask(sender), transactionId),
                false);
    }

    /** Transfer started (event: transaction.initiated): the sender was debited, fraud check running. */
    public void sendInitiatedAlertNotification(Map<String, Object> payload) {
        String transactionId = requiredText(payload, "transactionId");
        String sender = requiredText(payload, "senderAccountNumber");
        String receiver = requiredText(payload, "receiverAccountNumber");
        String amount = formatAmount(payload);
        log.info("Sending initiated alert for transaction {}", transactionId);

        sendAlert(sender, "Transfer of " + amount + " initiated",
                String.format("%s has been debited from your account %s for a transfer to account %s. "
                                + "It is being processed. Transaction id: %s.",
                        amount, mask(sender), mask(receiver), transactionId),
                false);
    }

    /** Transfer cancelled and money returned (event: transaction.refunded): alert the sender. */
    public void sendRefundedAlertNotification(Map<String, Object> payload) {
        String transactionId = requiredText(payload, "transactionId");
        String sender = requiredText(payload, "senderAccountNumber");
        String amount = formatAmount(payload);
        String reason = optionalText(payload, "reason", "Transfer could not be completed");
        log.info("Sending refunded alert for transaction {}", transactionId);

        sendAlert(sender, "Refund of " + amount,
                String.format("Your transfer of %s was cancelled and %s has been credited back to your account %s. "
                                + "Reason: %s. Transaction id: %s.",
                        amount, amount, mask(sender), reason, transactionId),
                false);
    }

    /** Fraud confirmed (event: fraud.detected): account-service has blocked the sender's account - warn them. */
    public void sendFraudAlertNotification(Map<String, Object> payload) {
        String transactionId = requiredText(payload, "transactionId");
        String sender = requiredText(payload, "senderAccountNumber");
        String amount = formatAmount(payload);
        String reason = optionalText(payload, "reason", "Suspicious activity");
        log.info("Sending fraud alert for transaction {}", transactionId);

        sendAlert(sender, "Security alert: your account has been blocked",
                String.format("We stopped a transfer of %s from your account %s (%s) and blocked the account "
                                + "to protect your money. If this wasn't you, contact the bank immediately. "
                                + "Transaction id: %s.",
                        amount, mask(sender), reason, transactionId),
                false);
    }

    /** Razorpay payment succeeded (event: payment.completed, from payment-service). */
    public void sendPaymentCompletedAlertNotification(Map<String, Object> payload) {
        String paymentId = requiredText(payload, "paymentId");
        String account = requiredText(payload, "accountNumber");
        String amount = formatAmount(payload);
        String razorpayPaymentId = optionalText(payload, "razorpayPaymentId", "-");
        log.info("Sending payment completed alert for payment {}", paymentId);

        sendAlert(account, "Payment of " + amount + " successful",
                String.format("Your payment of %s to account %s was successful. Payment id: %s, Razorpay id: %s.",
                        amount, mask(account), paymentId, razorpayPaymentId),
                false);
    }

    /** Razorpay payment failed (event: payment.failed, from payment-service). */
    public void sendPaymentFailedAlertNotification(Map<String, Object> payload) {
        String paymentId = requiredText(payload, "paymentId");
        String account = requiredText(payload, "accountNumber");
        String amount = formatAmount(payload);
        String reason = optionalText(payload, "reason", "Payment failed");
        log.info("Sending payment failed alert for payment {}", paymentId);

        sendAlert(account, "Payment of " + amount + " failed",
                String.format("Your payment of %s to account %s failed. Reason: %s. "
                                + "If any money was deducted, Razorpay returns it automatically. Payment id: %s.",
                        amount, mask(account), reason, paymentId),
                false);
    }

    /**
     * Delivers one alert to the holder of {@code accountNumber}.
     * <p>
     * TODO: real delivery - look up the account holder's email/phone in account-service and send it with
     *  JavaMailSender (spring.mail.* in application.yml) or an SMS provider. Until then alerts are only logged.
     *
     * @param sensitive true when the message contains an OTP: then the text is never written to the log
     */
    private void sendAlert(String accountNumber, String subject, String message, boolean sensitive) {
        log.info("[ALERT] to account {} - {}: {}", mask(accountNumber), subject,
                sensitive ? "<hidden: contains OTP>" : message);
    }

    // ---------------------------------------------------------------- helpers

    /** "758885717853" -> "XXXXXXXX7853": enough for the customer to recognise, useless to anyone else. */
    static String mask(String accountNumber) {
        if (accountNumber.length() <= 4) {
            return accountNumber;
        }
        return "X".repeat(accountNumber.length() - 4) + accountNumber.substring(accountNumber.length() - 4);
    }

    /** 500 / 500.5 / "500.50" -> "INR 500.50" (exact: BigDecimal from the text, never via double maths). */
    static String formatAmount(Map<String, Object> payload) {
        String text = requiredText(payload, "amount");
        try {
            return "INR " + new BigDecimal(text).setScale(2, RoundingMode.HALF_UP).toPlainString();
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Event field 'amount' is not a number: " + text, e);
        }
    }

    /** Missing required field = bad event: IllegalArgumentException is not retried by the error handler. */
    private static String requiredText(Map<String, Object> payload, String field) {
        Object value = payload.get(field);
        if (value == null || value.toString().isBlank()) {
            throw new IllegalArgumentException("Event is missing required field '" + field + "'");
        }
        return value.toString();
    }

    private static String optionalText(Map<String, Object> payload, String field, String fallback) {
        Object value = payload.get(field);
        return value == null || value.toString().isBlank() ? fallback : value.toString();
    }
}
