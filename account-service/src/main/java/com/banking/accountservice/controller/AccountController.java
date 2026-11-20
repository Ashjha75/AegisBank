package com.banking.accountservice.controller;

import com.banking.accountservice.dto.AccountResponse;
import com.banking.accountservice.dto.CreateAccountRequest;
import com.banking.accountservice.service.AccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/v1/accounts")
@Slf4j
@RequiredArgsConstructor
public class AccountController {
    private final AccountService accountService;

    @PostMapping("/create")
    public ResponseEntity<AccountResponse> createAccount(@Valid @RequestBody CreateAccountRequest createAccountRequest) {

        return ResponseEntity.status(HttpStatus.CREATED).body(
                accountService.createAccount(createAccountRequest)
        );
    }

    @GetMapping("/{accountNumber}")
    public  ResponseEntity<AccountResponse> getAccount(@PathVariable("accountNumber") String accountNumber) {
        return  ResponseEntity.status(HttpStatus.OK).body(accountService.getAccount(accountNumber));
    }

    @GetMapping("/{accountNumber}/balance")
    public  ResponseEntity<BigDecimal> getAccountBalance(@PathVariable("accountNumber") String accountNumber) {
        return  ResponseEntity.status(HttpStatus.OK).body(accountService.getAccountBalance(accountNumber));
    }

    // block / deduct / credit are service-to-service only: see InternalAccountController

}
