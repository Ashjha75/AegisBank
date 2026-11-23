package com.banking.frauddetectionservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.math.BigDecimal;

/**
 * <pre>
 * OpenFeign client for account-service. The base URL comes from ACCOUNT_SERVICE_URL in
 * fraud-detection-service/.env.
 * Errors arrive as {@code feign.FeignException}: 404 = unknown account (not retried),
 * 5xx or -1 = account-service failed or was unreachable (retried, then sent to the DLT).
 * </pre>
 */
@FeignClient(name = "account-service", url = "${services.account.url}")
public interface AccountServiceClient {

    /** Current balance of the account, as a plain number (INR). */
    @GetMapping("/api/v1/accounts/{accountNumber}/balance")
    BigDecimal getBalance(@PathVariable("accountNumber") String accountNumber);

}
