package com.banking.apigateway.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.servlet.function.ServerRequest;

import java.time.Duration;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Plain unit test - no Redis needed. */
class RateLimitConfigTest {

    @Test
    void refillPeriodGivesReplenishRatePerSecond() {
        // 20 tokens per 2 s = 10 requests per second, bursts of 20
        assertThat(new RateLimitProperties(10, 20).refillPeriod()).isEqualTo(Duration.ofSeconds(2));
        assertThat(new RateLimitProperties(5, 5).refillPeriod()).isEqualTo(Duration.ofSeconds(1));
    }

    @Test
    void rejectsImpossibleLimits() {
        assertThatThrownBy(() -> new RateLimitProperties(0, 20)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new RateLimitProperties(10, 5)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void keyIsTheClientIpNotTheForwardedHeader() {
        MockHttpServletRequest servletRequest = new MockHttpServletRequest("GET", "/api/v1/accounts/1");
        servletRequest.setRemoteAddr("203.0.113.7");
        servletRequest.addHeader("X-Forwarded-For", "1.2.3.4");   // client-controlled, must be ignored

        ServerRequest request = ServerRequest.create(servletRequest, List.of());

        assertThat(GatewayRoutesConfig.clientKey(request)).isEqualTo("rate-limit:203.0.113.7");
    }
}
