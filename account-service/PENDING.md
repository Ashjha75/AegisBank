# account-service - pending work

Open items from the review on 2026-11-20. Ordered by priority. Tick them off as you go.

> First, before anything else: **restart account-service in IntelliJ** - the instance running on
> port 8081 still has the old code (before the Kafka config, locking and `/internal` changes).
> The review fixes themselves are not committed yet - review them and commit.

---

## High priority

### 1. Idempotent Kafka consumers (prevent double credits)
- [ ] Add a unique `transactionId` to every event (`transaction.completed`, `fraud.detected`, refunds).
- [ ] Create a `processed_events` table (entity `ProcessedEvent` with a unique `eventId` column).
- [ ] In `AccountEventConsumer`, inside the same `@Transactional` as the balance change: if the
      `transactionId` is already in `processed_events`, log and skip; otherwise apply the change and insert it.

**Why:** Kafka delivers *at least once*. After a crash or rebalance the same `transaction.completed`
event can arrive twice, and today `creditBalance` would credit the receiver twice.

**Where:** `service/AccountEventConsumer.java`, `service/AccountService.java`, new `entity/ProcessedEvent.java`
+ `repository/ProcessedEventRepository.java`.

### 2. Decide which account `fraud.detected` blocks
- [ ] Confirm with the fraud-detection-service design: block the **sender** (compromised account
      draining money) or the **receiver**?
- [ ] Update `consumeFraudDetected` to read the right field (there is a `TODO` there now - it reads
      `receiverAccountNumber`).
- [ ] Remember the SAGA: after blocking, the transaction-service still refunds the sender via
      `creditBalance` - this works because BLOCKED accounts still accept credits.

### 3. Authentication & authorization
- [ ] Add JWT authentication at the api-gateway (Spring Security / OAuth2 resource server).
- [ ] Pass the authenticated user to account-service (e.g. a trusted `X-User-Id` header set by the gateway).
- [ ] In `getAccount` / `getAccountBalance`: only return the account if it belongs to the caller
      (store an owner/user id on `Account`).

**Why:** today anyone can call `GET /api/v1/accounts/{number}` through the gateway and see the
email, phone and balance of any account.

### 4. Enforce the daily transaction limit
- [ ] `dailyTransactionLimit` is stored on `Account` but never checked.
- [ ] In `deductBalance`, sum today's successful debits for the account and reject (new
      `DailyLimitExceededException` -> 422, add an `ErrorCode`) if `todayTotal + amount > limit`.
- [ ] Needs a record of debits per day: either a small `account_debits` table here, or ask
      transaction-service for today's total (decide which service owns it).

---

## Medium priority

### 5. Move business numbers to configuration
- [ ] Daily limits are hard-coded in `createAccount` (`100000` for SAVINGS, `500000` otherwise).
      Move them to `AccountProperties` like the minimum balance:
      `account.daily-limit.savings: ${ACCOUNT_DAILY_LIMIT_SAVINGS:100000}` etc.
- [ ] Add the new variables to `account-service/.env.example` (with a comment) and to your local `.env`.

### 6. Database migrations (Flyway)
- [ ] Add `org.flywaydb:flyway-core` + `flyway-database-postgresql`.
- [ ] Create `src/main/resources/db/migration/V1__create_accounts.sql` matching the current table.
- [ ] Switch `spring.jpa.hibernate.ddl-auto` from `update` to `validate`.

**Why:** `ddl-auto: update` never drops/renames columns and can't be reviewed - not safe beyond local dev.

### 7. transaction-service must call the internal endpoints
- [ ] When writing the transaction-service Feign client, use
      `http://<account-service>/internal/v1/accounts/{accountNumber}/deduct|credit|block`
      (`ACCOUNT_SERVICE_URL` is already in `transaction-service/.env`).
- [ ] Never add an `/internal/**` route to the api-gateway.

### 8. Hide internal endpoints from the public Swagger UI
- [ ] Annotate `InternalAccountController` with `@Hidden` (io.swagger.v3.oas.annotations.Hidden),
      or put it in a separate springdoc group - "Try it out" for them goes through the gateway and 404s anyway.

---

## Low priority / clean-up

- [ ] **PII in logs:** `createAccount` logs the full email at INFO. Mask it (e.g. `a***@example.com`)
      or log the account number instead.
- [ ] **`AccountServiceApplication.main`:** replace `System.out.println("AccountServiceApplication working 🪄")`
      with `log.info(...)` (or remove - Spring already logs "Started AccountServiceApplication").
- [ ] **Balance endpoint response:** `GET /{accountNumber}/balance` returns a bare number. Consider a
      small record, e.g. `BalanceResponse(String accountNumber, BigDecimal balance)`, so fields can be
      added later without breaking clients.
- [ ] **Path variable validation:** validate `accountNumber` path variables (12 digits,
      `AccountNumberGenerator.isValid`) and return 400 for malformed numbers instead of a DB lookup.
- [ ] **Typed Kafka events:** replace `Map<String, Object>` payloads with records
      (e.g. `TransactionCompletedEvent(String transactionId, String receiverAccountNumber, BigDecimal amount)`)
      once the event contracts with transaction-service are fixed.
- [ ] **Minimum balance after debits:** decide whether a deduct may take the balance below the
      account type's minimum balance (Indian banks usually allow it and charge a penalty) - today it can.

---

## Already done in the review (for reference)

- Kafka config in `application.yml` fixed (class names were mis-cased; service couldn't start).
- `deduct` / `credit` / `block` moved to `InternalAccountController` under `/internal/v1/accounts`.
- Balance/status changes are `@Transactional` with a pessimistic row lock (`findByAccountNumberForUpdate`).
- Amount validation in the service (no zero/negative/over-precise amounts).
- Kafka consumer parses `amount` safely; failures go to `<topic>-dlt` via `config/KafkaConfig`.
- BLOCKED accounts still accept credits (SAGA refunds); only CLOSED rejects them.
- Health details only shown to authorized users.
- PostgreSQL dialect: intentionally **not** set - Hibernate detects it automatically.
