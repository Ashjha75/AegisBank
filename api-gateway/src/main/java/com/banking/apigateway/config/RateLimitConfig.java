package com.banking.apigateway.config;

import io.github.bucket4j.distributed.ExpirationAfterWriteStrategy;
import io.github.bucket4j.distributed.proxy.AsyncProxyManager;
import io.github.bucket4j.redis.lettuce.Bucket4jLettuce;
import io.lettuce.core.RedisClient;
import io.lettuce.core.RedisURI;
import io.lettuce.core.codec.ByteArrayCodec;
import io.lettuce.core.codec.RedisCodec;
import io.lettuce.core.codec.StringCodec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;

import java.time.Duration;

/**
 * Where the rate-limit buckets live: Redis, so every gateway instance shares the same counters.
 * <p>
 * The gateway's RateLimit filter (Bucket4jFilterFunctions) looks up an {@link AsyncProxyManager} bean.
 * Its keys are Strings because the key resolver (see GatewayRoutesConfig) returns a String.
 * {@code @Lazy}: Redis is connected on the first API request, so the gateway still starts (and serves
 * Swagger) while Redis is down.
 */
@Configuration
public class RateLimitConfig {

    /** Keep an idle client's bucket this long after it has fully refilled, then let Redis delete it. */
    private static final Duration KEEP_FULL_BUCKET = Duration.ofSeconds(10);

    @Bean(destroyMethod = "shutdown")
    @Lazy
    public RedisClient rateLimitRedisClient(@Value("${spring.data.redis.host}") String host,
                                            @Value("${spring.data.redis.port}") int port,
                                            @Value("${spring.data.redis.password}") String password) {
        return RedisClient.create(RedisURI.builder()
                .withHost(host)
                .withPort(port)
                .withPassword(password.toCharArray())
                .build());
    }

    @Bean
    @Lazy
    public AsyncProxyManager<String> rateLimitProxyManager(@Lazy RedisClient rateLimitRedisClient) {
        var connection = rateLimitRedisClient.connect(RedisCodec.of(StringCodec.UTF8, ByteArrayCodec.INSTANCE));
        return Bucket4jLettuce.casBasedBuilder(connection)
                .expirationAfterWrite(ExpirationAfterWriteStrategy.basedOnTimeForRefillingBucketUpToMax(KEEP_FULL_BUCKET))
                .build()
                .asAsync();
    }
}
