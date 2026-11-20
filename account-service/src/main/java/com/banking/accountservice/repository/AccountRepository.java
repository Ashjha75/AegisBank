package com.banking.accountservice.repository;

import com.banking.accountservice.entity.Account;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, String> {

    // Spring Data builds the query from the method name, so it must be exactly "existsBy..."
    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);

    boolean existsByAccountNumber(String accountNumber);

    Optional<Account> findByAccountNumber(String accountNumber);

    /**
     * Same lookup, but locks the row (SELECT ... FOR UPDATE) until the transaction ends.
     * Use it for every balance/status change, so two concurrent transfers can't both read the
     * same balance and overwrite each other. Must be called inside a @Transactional method.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from Account a where a.accountNumber = :accountNumber")
    Optional<Account> findByAccountNumberForUpdate(@Param("accountNumber") String accountNumber);
}
