package com.banking.apigateway.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

/**
 * Per-client rate limit for the API routes, bound from {@code gateway.rate-limit.*} in application.yml
 * (values from GATEWAY_RATE_LIMIT_* in api-gateway/.env).
 * <p>
 * Token bucket: a client may send a burst of {@code burstCapacity} requests, and gets
 * {@code replenishRate} new requests back every second. Over the limit the gateway answers 429.
 *
 * @param replenishRate requests per second a client can keep up (e.g. 10)
 * @param burstCapacity most requests allowed at once (e.g. 20); must be >= replenishRate
 */
@ConfigurationProperties(prefix = "gateway.rate-limit")
public record RateLimitProperties(int replenishRate, int burstCapacity) {

    public RateLimitProperties {
        if (replenishRate <= 0 || burstCapacity < replenishRate) {
            throw new IllegalArgumentException("gateway.rate-limit needs replenish-rate > 0 and burst-capacity >= "
                    + "replenish-rate, got replenish-rate=" + replenishRate + ", burst-capacity=" + burstCapacity);
        }
    }

    /**
     * Bucket4j refills {@code burstCapacity} tokens per period, so the period that gives
     * {@code replenishRate} tokens per second is burstCapacity / replenishRate seconds (20 / 10 = 2 s).
     */
    public Duration refillPeriod() {
        return Duration.ofMillis(burstCapacity * 1000L / replenishRate);
    }
}
