package com.banking.apigateway.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.function.RouterFunction;
import org.springframework.web.servlet.function.ServerRequest;
import org.springframework.web.servlet.function.ServerResponse;

import static org.springframework.cloud.gateway.server.mvc.filter.BeforeFilterFunctions.uri;
import static org.springframework.cloud.gateway.server.mvc.filter.Bucket4jFilterFunctions.rateLimit;
import static org.springframework.cloud.gateway.server.mvc.handler.GatewayRouterFunctions.route;
import static org.springframework.cloud.gateway.server.mvc.handler.HandlerFunctions.http;
import static org.springframework.web.servlet.function.RequestPredicates.path;

/**
 * Client API routes, each rate limited per client IP (429 Too Many Requests when over the limit,
 * remaining requests in the X-RateLimit-Remaining response header).
 * <p>
 * Defined in Java instead of application.yml because the rate limit needs a key resolver function,
 * which YAML can't express. Swagger docs routes stay in application.yml (not rate limited).
 * Service URLs still come from {@code services.*} in application.yml.
 */
@Configuration
public class GatewayRoutesConfig {

    private static final String KEY_PREFIX = "rate-limit:";

    @Bean
    public RouterFunction<ServerResponse> accountServiceRoute(@Value("${services.account}") String url,
                                                              RateLimitProperties limits) {
        return apiRoute("account-service", "/api/v1/accounts/**", url, limits);
    }

    @Bean
    public RouterFunction<ServerResponse> transactionServiceRoute(@Value("${services.transaction}") String url,
                                                                  RateLimitProperties limits) {
        return apiRoute("transaction-service", "/api/v1/transactions/**", url, limits);
    }

    @Bean
    public RouterFunction<ServerResponse> paymentServiceRoute(@Value("${services.payment}") String url,
                                                              RateLimitProperties limits) {
        return apiRoute("payment-service", "/api/v1/payments/**", url, limits);
    }

    private static RouterFunction<ServerResponse> apiRoute(String id, String pathPattern, String url,
                                                           RateLimitProperties limits) {
        return route(id)
                .route(path(pathPattern), http())
                .before(uri(url))
                .filter(rateLimit(config -> config
                        .setCapacity(limits.burstCapacity())
                        .setPeriod(limits.refillPeriod())
                        .setKeyResolver(GatewayRoutesConfig::clientKey)))
                .build();
    }

    /**
     * One bucket per client IP, shared by all routes. Uses the TCP remote address, not X-Forwarded-For:
     * that header is set by the client and could be faked to dodge the limit. Behind a load balancer,
     * enable server.forward-headers-strategy so the real client IP is used.
     */
    static String clientKey(ServerRequest request) {
        return KEY_PREFIX + request.servletRequest().getRemoteAddr();
    }
}
