package com.banking.notificationservice.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@Slf4j
public class NotificationService {
    public void sendAlertNotification(Map<String, Object> payload) {
        try {
            String accountId = (String) payload.get("accountId");
            String transactionId = (String) payload.get("transactionId");
            String otp = (String) payload.get("otp");
            String amount = (String) payload.get("amount");
            String reason = (String) payload.get("reason");
            log.info("Sending alert notification to account {} for transaction {} with OTP {} for amount {} due to reason: {}", accountId, transactionId, otp, amount, reason);

            sendAlert(accountId,
                    String.format(
                            "Suspicious activity detected on your account "+
                                    "Reason: %s." +
                                    "A transaction of %s is pending verification."+
                                    "Your OTP is: %s. Valid for 5 minutes."+
                                    "If this wasn't you - ignore this message."

                    ));
        } catch (Exception e) {
            log.error("Error while sending alert notification: {}", e.getMessage(), e);
            throw new RuntimeException("Error while sending alert notification", e);
        }
    }
}
