package com.banking.accountservice.controller;

import com.banking.accountservice.dto.AccountResponse;
import com.banking.accountservice.dto.CreateAccountRequest;
import com.banking.accountservice.service.AccountService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

/** Client-facing account APIs, routed by the api-gateway under /api/v1/accounts. */
@RestController
@RequestMapping("/api/v1/accounts")
@Tag(name = "Accounts", description = "Open bank accounts and look up their details and balance")
@Slf4j
@RequiredArgsConstructor
public class AccountController {
    private final AccountService accountService;

    @Operation(summary = "Open a new account",
            description = "Creates an ACTIVE account with a generated 12-digit account number. "
                    + "Email and phone must be unique. The initial deposit must meet the minimum balance "
                    + "for the account type (SAVINGS / CURRENT / FIXED_DEPOSIT, set in account-service/.env). "
                    + "Daily transaction limit: 1,00,000 for SAVINGS, 5,00,000 for other types.")
    @ApiResponse(responseCode = "201", description = "Account created")
    @ApiResponse(responseCode = "400", description = "Invalid fields or initial deposit below the minimum (VALIDATION_FAILED)")
    @ApiResponse(responseCode = "409", description = "Email or phone already used by another account (RESOURCE_ALREADY_EXISTS)")
    @PostMapping("/create")
    public ResponseEntity<AccountResponse> createAccount(@Valid @RequestBody CreateAccountRequest createAccountRequest) {

        return ResponseEntity.status(HttpStatus.CREATED).body(
                accountService.createAccount(createAccountRequest)
        );
    }

    @Operation(summary = "Get account details",
            description = "Holder, contact details, type, status, balance and limits of one account.")
    @ApiResponse(responseCode = "200", description = "Account found")
    @ApiResponse(responseCode = "404", description = "No account with this number (RESOURCE_NOT_FOUND)")
    @GetMapping("/{accountNumber}")
    public  ResponseEntity<AccountResponse> getAccount(
            @Parameter(description = "12-digit account number", example = "758885717853")
            @PathVariable("accountNumber") String accountNumber) {
        return  ResponseEntity.status(HttpStatus.OK).body(accountService.getAccount(accountNumber));
    }

    @Operation(summary = "Get account balance", description = "Current balance only, as a plain number (INR).")
    @ApiResponse(responseCode = "200", description = "Current balance")
    @ApiResponse(responseCode = "404", description = "No account with this number (RESOURCE_NOT_FOUND)")
    @GetMapping("/{accountNumber}/balance")
    public  ResponseEntity<BigDecimal> getAccountBalance(
            @Parameter(description = "12-digit account number", example = "758885717853")
            @PathVariable("accountNumber") String accountNumber) {
        return  ResponseEntity.status(HttpStatus.OK).body(accountService.getAccountBalance(accountNumber));
    }

    // block / deduct / credit are service-to-service only: see InternalAccountController

}
