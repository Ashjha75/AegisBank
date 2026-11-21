package com.banking.transactionservice.mapper;

import com.banking.transactionservice.dto.TransferRequest;
import com.banking.transactionservice.dto.TransactionResponse;
import com.banking.transactionservice.entity.Transaction;
import com.banking.transactionservice.entity.TransactionStatus;
import com.banking.transactionservice.entity.TransactionType;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

/** Plain unit test - no Spring context needed. */
class TransactionMapperTest {

    private final TransactionMapper mapper = new TransactionMapper();

    @Test
    void toEntityCopiesOnlyClientSuppliedFields() {
        TransferRequest request = new TransferRequest(
                "363100275256", "562014000524", new BigDecimal("1500.50"), "Rent");

        Transaction transaction = mapper.toEntity(request);

        assertThat(transaction.getSenderAccountNumber()).isEqualTo("363100275256");
        assertThat(transaction.getReceiverAccountNumber()).isEqualTo("562014000524");
        assertThat(transaction.getAmount()).isEqualByComparingTo("1500.50");
        assertThat(transaction.getDescription()).isEqualTo("Rent");
        // Business fields are the service's job, not the mapper's
        assertThat(transaction.getId()).isNull();
        assertThat(transaction.getType()).isNull();
        assertThat(transaction.getStatus()).isNull();
        assertThat(transaction.getReferenceNumber()).isNull();
    }

    @Test
    void toResponseMapsEveryField() {
        LocalDateTime created = LocalDateTime.now().minusMinutes(1);
        LocalDateTime completed = LocalDateTime.now();
        Transaction transaction = new Transaction("tx-1", "363100275256", "562014000524", new BigDecimal("1500.50"),
                TransactionType.TRANSFER, TransactionStatus.FAILED, "Rent", "Insufficient balance", "TXN123",
                created, completed);

        TransactionResponse response = mapper.toResponse(transaction);

        assertThat(response.id()).isEqualTo("tx-1");
        assertThat(response.senderAccountNumber()).isEqualTo("363100275256");
        assertThat(response.receiverAccountNumber()).isEqualTo("562014000524");
        assertThat(response.amount()).isEqualByComparingTo("1500.50");
        assertThat(response.type()).isEqualTo(TransactionType.TRANSFER);
        assertThat(response.status()).isEqualTo(TransactionStatus.FAILED);
        assertThat(response.description()).isEqualTo("Rent");
        assertThat(response.failureReason()).isEqualTo("Insufficient balance");
        assertThat(response.referenceNumber()).isEqualTo("TXN123");
        assertThat(response.createdAt()).isEqualTo(created);
        assertThat(response.completedAt()).isEqualTo(completed);
    }
}
