package com.banking.transactionservice.service;

import com.banking.transactionservice.dto.TransactionResponse;
import com.banking.transactionservice.dto.TransferRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class TransactionService {
    public TransactionResponse transfer(@Valid TransferRequest transferRequest) {
    }

    public TransactionResponse getTransaction(String transactionId) {
    }

    public TransactionResponse getTransactionHistory(String accountNumber) {
    }
}
