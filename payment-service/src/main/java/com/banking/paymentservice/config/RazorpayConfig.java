package com.banking.paymentservice.config;

import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * One shared RazorpayClient for the whole service (it holds an HTTP client - don't create one per request).
 * Inject it where needed, e.g. {@code razorpayClient.orders.create(orderJson)}.
 */
@Configuration
public class RazorpayConfig {

    @Bean
    public RazorpayClient razorpayClient(RazorpayProperties properties) throws RazorpayException {
        return new RazorpayClient(properties.keyId(), properties.keySecret());
    }
}
