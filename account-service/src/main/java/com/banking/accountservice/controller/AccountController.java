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
    public  ResponseEntity<AccountResponse> getAccountBalance(@PathVariable("accountNumber") String accountNumber) {
        return  ResponseEntity.status(HttpStatus.OK).body(accountService.getAccountBalance(accountNumber));
    }

    @PutMapping("/{accountNumber}/block")
    public ResponseEntity<String> blockAccount(
            @PathVariable String accountNumber
    ){
        accountService.blockAccount(accountNumber);
        return ResponseEntity.ok("Account Blocked Successfully");
    }

    /**
     * SAGA : STEP-1 Deduct Balance -
     * Called By Transaction Service When Transfer is Initiated
     */
    @PutMapping("/{accountNumber}/deduct")
    public ResponseEntity<String> deductBalance(@PathVariable String accountNumber,
                                                @RequestParam BigDecimal amount){

        accountService.deductBalance(accountNumber,amount);
        return  ResponseEntity.ok("Account Deducted Successfully");
    }

    /**
     * SAGA : STEP-4 Compensating transaction endpoint -
     * Called by transaction service in two scenarios: </br>
     * 1: fraud detected -> refund sender (undo step 1)</br>
     * 2: Transaction completed -> credit receiver
     */
    public ResponseEntity<String> creditBalance(@PathVariable String accountNumber,
                                                @RequestParam BigDecimal amount){
        accountService.creditBalance(accountNumber,amount);
        return  ResponseEntity.ok("Account Credit Successfully");

    }

}
