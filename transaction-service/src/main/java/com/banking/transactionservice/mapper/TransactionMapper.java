package com.banking.transactionservice.mapper;

import com.banking.transactionservice.dto.TransactionRequest;
import com.banking.transactionservice.dto.TransactionResponse;
import com.banking.transactionservice.entity.Transaction;
import org.springframework.stereotype.Component;

/**
 * Converts between Transaction DTOs and the {@link Transaction} entity - hand-written, no mapping library.
 * <p>
 * The mapper only copies data. Business decisions (type, status, reference number, failure reason,
 * completedAt) stay in the service layer. Inject it like any other bean:
 * <pre>{@code
 * Transaction transaction = transactionMapper.toEntity(request);
 * transaction.setType(TransactionType.TRANSFER);
 * transaction.setStatus(TransactionStatus.PENDING);
 * ...
 * return transactionMapper.toResponse(transactionRepository.saveAndFlush(transaction));
 * }</pre>
 */
@Component
public class TransactionMapper {

    /** Copies the client-supplied fields. The service must still set type, status and referenceNumber. */
    public Transaction toEntity(TransactionRequest request) {
        return Transaction.builder()
                .senderAccountNumber(request.senderAccountNumber())
                .receiverAccountNumber(request.receiverAccountNumber())
                .amount(request.amount())
                .description(request.description())
                .build();
    }

    public TransactionResponse toResponse(Transaction transaction) {
        return new TransactionResponse(
                transaction.getId(),
                transaction.getSenderAccountNumber(),
                transaction.getReceiverAccountNumber(),
                transaction.getAmount(),
                transaction.getType(),
                transaction.getStatus(),
                transaction.getDescription(),
                transaction.getFailureReason(),
                transaction.getReferenceNumber(),
                transaction.getCreatedAt(),
                transaction.getCompletedAt()
        );
    }
}
