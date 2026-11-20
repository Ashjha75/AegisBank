package com.banking.accountservice.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * Publishes this service's API spec at /v3/api-docs (no UI here - the combined Swagger UI lives
 * in api-gateway). The server URL is the gateway, so "Try it out" calls go through the gateway.
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI openAPI(@Value("${spring.application.name}") String serviceName,
                           @Value("${openapi.gateway-url}") String gatewayUrl) {
        return new OpenAPI()
                .info(new Info().title(serviceName + " API").version("v1"))
                .servers(List.of(new Server().url(gatewayUrl).description("API gateway")));
    }
}
