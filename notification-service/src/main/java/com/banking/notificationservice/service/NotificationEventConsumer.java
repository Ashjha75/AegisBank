package com.banking.notificationservice.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class NotificationEventConsumer {

    private  final NotificationService notificationService;

    /**
     * Consume OTP generated event
     * </br>
     * Notify user with OTP
     *
     * @param payload OTP generated event data
     */
    @KafkaListener(topics = "transaction.otp.generated")
    public void consumeOTPGenerated(@Payload Map<String, Object> payload) {
        log.info("Received OTP Generated Event");
       notificationService.sendAlertNotification(payload);
    }
}
