package com.banking.transactionservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.math.BigDecimal;

/**
 * OpenFeign client for account-service's service-to-service endpoints ({@code /internal/v1/accounts}).
 * The base URL comes from ACCOUNT_SERVICE_URL in transaction-service/.env.
 * Errors arrive as {@code feign.FeignException}: status 4xx = account-service refused (e.g. insufficient
 * balance), 5xx or -1 = account-service failed or was unreachable.
 */
@FeignClient(name = "account-service", url = "${services.account.url}")
public interface AccountClient {

    /** SAGA step 1: take the money from the sender. */
    @PutMapping("/internal/v1/accounts/{accountNumber}/deduct")
    String deductBalance(@PathVariable("accountNumber") String accountNumber,
                         @RequestParam("amount") BigDecimal amount);

    /** SAGA step 2: give the money to the receiver - or refund the sender when a transfer fails. */
    @PutMapping("/internal/v1/accounts/{accountNumber}/credit")
    String creditBalance(@PathVariable("accountNumber") String accountNumber,
                         @RequestParam("amount") BigDecimal amount);
}
