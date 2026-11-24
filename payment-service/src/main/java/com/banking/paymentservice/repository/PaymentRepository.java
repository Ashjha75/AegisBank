package com.banking.paymentservice.repository;

import com.banking.paymentservice.entity.Payment;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, String> {

    Optional<Payment> findByRazorpayOrderId(String razorpayOrderId);

    /**
     * Loads the payment with a pessimistic write lock (SELECT ... FOR UPDATE), so two deliveries of the
     * same Razorpay webhook can't both mark it paid and credit the account twice.
     * Call it inside a @Transactional method.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Payment p where p.razorpayOrderId = :razorpayOrderId")
    Optional<Payment> findByRazorpayOrderIdForUpdate(@Param("razorpayOrderId") String razorpayOrderId);

    /** Payments into an account, newest first. */
    List<Payment> findByAccountNumberOrderByCreatedAtDesc(String accountNumber);
}
