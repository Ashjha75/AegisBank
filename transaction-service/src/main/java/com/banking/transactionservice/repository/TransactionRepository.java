package com.banking.transactionservice.repository;

import com.banking.transactionservice.entity.Transaction;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TransactionRepository extends JpaRepository<Transaction, String> {

    /** Every transaction where the account sent or received money, newest first. */
    List<Transaction> findBySenderAccountNumberOrReceiverAccountNumberOrderByCreatedAtDesc(
            String senderAccountNumber, String receiverAccountNumber);

    /**
     * Loads the row with a pessimistic write lock (SELECT ... FOR UPDATE), so two concurrent
     * status changes (e.g. two OTP verifications) can't both credit the receiver.
     * Call it inside a @Transactional method.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from Transaction t where t.id = :id")
    Optional<Transaction> findByIdForUpdate(@Param("id") String id);
}
