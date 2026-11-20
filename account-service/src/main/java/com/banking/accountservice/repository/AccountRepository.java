package com.banking.accountservice.repository;

import com.banking.accountservice.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AccountRepository extends JpaRepository<Account, String> {

    // Spring Data builds the query from the method name, so it must be exactly "existsBy..."
    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);

    boolean existsByAccountNumber(String accountNumber);
}
