package com.banking.accountservice.controller;

import com.banking.accountservice.service.AccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;

/**
 * Service-to-service endpoints that move money or change account status.
 * <p>
 * They live under {@code /internal} on purpose: the api-gateway only routes {@code /api/v1/accounts/**},
 * so these are NOT reachable by clients through the gateway - only by other services on the internal
 * network (e.g. transaction-service via OpenFeign at http://account-service:8081/internal/v1/accounts/...).
 * Never add an {@code /internal/**} route to the gateway.
 */
@RestController
@RequestMapping("/internal/v1/accounts")
@RequiredArgsConstructor
public class InternalAccountController {

    private final AccountService accountService;

    @PutMapping("/{accountNumber}/block")
    public ResponseEntity<String> blockAccount(@PathVariable String accountNumber) {
        accountService.blockAccount(accountNumber);
        return ResponseEntity.ok("Account Blocked Successfully");
    }

    /**
     * SAGA : STEP-1 Deduct Balance -
     * Called By Transaction Service When Transfer is Initiated
     */
    @PutMapping("/{accountNumber}/deduct")
    public ResponseEntity<String> deductBalance(@PathVariable String accountNumber,
                                                @RequestParam BigDecimal amount) {
        accountService.deductBalance(accountNumber, amount);
        return ResponseEntity.ok("Account Deducted Successfully");
    }

    /**
     * SAGA : STEP-4 Compensating transaction endpoint -
     * Called by transaction service in two scenarios: <br>
     * 1: fraud detected -> refund sender (undo step 1)<br>
     * 2: Transaction completed -> credit receiver
     */
    @PutMapping("/{accountNumber}/credit")
    public ResponseEntity<String> creditBalance(@PathVariable String accountNumber,
                                                @RequestParam BigDecimal amount) {
        accountService.creditBalance(accountNumber, amount);
        return ResponseEntity.ok("Account Credit Successfully");
    }
}
