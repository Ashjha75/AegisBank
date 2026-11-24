package com.banking.transactionservice.service;

import com.banking.transactionservice.config.OtpProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.math.BigDecimal;
import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Plain unit test - Redis is mocked. */
class OtpServiceTest {

    private static final String KEY = OtpService.KEY_PREFIX + "tx-1";

    private StringRedisTemplate redisTemplate;
    private ValueOperations<String, String> valueOps;
    private OtpService otpService;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        redisTemplate = mock(StringRedisTemplate.class);
        valueOps = mock(ValueOperations.class);
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        otpService = new OtpService(redisTemplate, new OtpProperties(new BigDecimal("50000"), 5, 3));
    }

    @Test
    void generateStoresOnlyTheHashWithExpiry() {
        String otp = otpService.generate("tx-1");

        assertThat(otp).matches("\\d{6}");
        ArgumentCaptor<String> stored = ArgumentCaptor.forClass(String.class);
        verify(valueOps).set(eq(KEY), stored.capture(), eq(Duration.ofMinutes(5)));
        assertThat(stored.getValue()).isEqualTo(OtpService.hash(otp)).isNotEqualTo(otp);
    }

    @Test
    void rightOtpIsValidAndDeleted() {
        when(valueOps.get(KEY)).thenReturn(OtpService.hash("123456"));

        assertThat(otpService.verify("tx-1", "123456")).isEqualTo(OtpService.Result.VALID);
        verify(redisTemplate).delete(KEY);
    }

    @Test
    void wrongOtpIsRejectedAndKept() {
        when(valueOps.get(KEY)).thenReturn(OtpService.hash("123456"));

        assertThat(otpService.verify("tx-1", "000000")).isEqualTo(OtpService.Result.WRONG);
        verify(redisTemplate, never()).delete(anyString());
    }

    @Test
    void missingKeyMeansExpired() {
        when(valueOps.get(KEY)).thenReturn(null);

        assertThat(otpService.verify("tx-1", "123456")).isEqualTo(OtpService.Result.EXPIRED);
    }
}
