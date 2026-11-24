# AegisBank - pending work

Open items for the whole project, ordered by priority. Tick them off as you go.
Last updated 2026-11-24, after building the customer UI and running it against all 6 services: open
account / transfer / OTP / history / Razorpay top-up all tested end to end through the browser, the
api-gateway and the BFF proxy.

> **In progress (owner):** UPI and ID handling. Razorpay test keys are in place - the create-order call
> and Checkout work (see item 1 for what is left: the public webhook URL).

---

## High priority

### 1. Razorpay test keys + webhook (in progress)
- [x] Real test keys are in `payment-service/.env`. Verified from the UI: `POST /api/v1/payments/create-order`
      returns 201 and Razorpay Checkout opens in test mode and captures a payment
      (domestic test card 5267 3181 8797 5449 - the account has international cards switched off,
      so 4111 1111 1111 1111 is declined).
- [ ] Create the webhook (Dashboard > Webhooks): URL `https://<public-host>/api/v1/payments/webhook`,
      events `payment.captured` + `payment.failed`, and put the secret you choose in `RAZORPAY_WEBHOOK_SECRET`.
- [ ] Locally Razorpay can't reach `localhost` - expose the gateway with a tunnel (e.g. `ngrok http 8080`)
      and use that URL for the webhook.
- [ ] Restart payment-service after editing `.env`, then test: create-order -> pay in Checkout (test card)
      -> webhook marks the payment `COMPLETED` -> `payment.completed` alert.

**Already verified:** the webhook path works (signed webhook -> `COMPLETED`, forged signature -> 400,
duplicate webhook -> no second event). Only the Razorpay API call itself fails, because of the keys.

### 2. Credit the account when a payment completes
- [ ] account-service: add a `@KafkaListener(topics = "payment.completed")` that credits `accountNumber`
      with `amount` (via `AccountService.creditBalance`).
- [ ] Make it idempotent: store the `paymentId` in a `processed_events` table (unique column) inside the same
      `@Transactional` as the credit; skip if it is already there. Kafka delivers *at least once*.

**Why:** today a successful payment only triggers an alert - the money never reaches the account
(tested again from the UI: balance unchanged after a captured ₹250.75 test payment). The "Add money"
screen says this out loud so nobody waits for a balance that will not change - remove that note when
the listener lands.

### 3. Authentication & authorization
- [ ] Add JWT authentication at the api-gateway (Spring Security / OAuth2 resource server).
- [ ] Pass the authenticated user to the services (a trusted `X-User-Id` header set by the gateway).
- [ ] Store an owner/user id on `Account`; only the owner may read an account, see its balance/history,
      transfer from it or pay into it.

**Why:** today anyone who can reach the gateway can read any account (email, phone, balance) and
**transfer money out of any account number**.

**What the UI does meanwhile:** `/app` keeps the account numbers you add in `localStorage` and works on
the active one (`frontend/src/lib/accounts/`). It is a stand-in, not security, and the UI says so on the
Accounts screen. When auth lands, replace that store with the session and drop the account switcher.

### 4. Enforce the daily transaction limit
- [ ] `dailyTransactionLimit` is stored on `Account` but never checked (tested: ₹60,000 + ₹70,000 on the same
      day both went through against a ₹1,00,000 limit).
- [ ] In `deductBalance`, sum today's debits for the account and reject (new `DailyLimitExceededException`
      -> 422 + an `ErrorCode`) if `todayTotal + amount > limit`.
- [ ] Decide who owns "today's debits": a small `account_debits` table in account-service, or a query to
      transaction-service.

### 5. Unblocking accounts
- [ ] There is no way to unblock an account after `fraud.detected` (the test sender `279012587051` is stuck
      BLOCKED). Add an admin-only endpoint (e.g. `PUT /internal/v1/accounts/{accountNumber}/unblock`, or an
      admin API once auth exists) with an audit log entry.

---

## Medium priority

### 6. Real alert delivery (notification-service)
- [ ] `NotificationService.sendAlert` only logs. Look up the account holder's email/phone from account-service
      (Feign) and send with `JavaMailSender` (uncomment `spring.mail.*` in `application.yml`, fill the
      `MAIL_*` values in `notification-service/.env`) or an SMS provider.
- [ ] Keep the OTP out of logs (already done) and remove the `O_O` debug prefix from the alert log line.

### 7. Reliability of events and refunds
- [ ] **Lost events:** `transaction.initiated / completed / refunded / fraud.detected` are fire-and-forget -
      if Kafka is down they are only logged. Use the transactional outbox pattern (an `outbox` table written in
      the same DB transaction, published by a scheduler) so no event is lost.
- [ ] **Failed refunds:** when refunding the sender fails, the transfer is marked
      "sender refund FAILED - needs manual check" and nothing retries it. Add a scheduled retry job or an
      admin reconciliation view.
- [ ] **Stuck transfers:** a transfer whose fraud verdict never arrives stays `PROCESSING` forever, and an
      unanswered OTP stays `PENDING_VERIFICATION` until someone calls verify-otp. Add a scheduled job that
      refunds/flags transfers older than N minutes.

### 8. Database migrations (Flyway) - all services
- [ ] Add `org.flywaydb:flyway-core` + `flyway-database-postgresql` to account-, transaction- and payment-service.
- [ ] Create `src/main/resources/db/migration/V1__init.sql` per service, matching the current tables.
- [ ] Switch `spring.jpa.hibernate.ddl-auto` from `update` to `validate`.
- [ ] transaction-service: drop the old unused `otp_hash` / `otp_expires_at` columns in a migration
      (OTPs now live in Redis).

### 9. Move business numbers to configuration
- [ ] Daily limits are hard-coded in `AccountService.createAccount` (`100000` for SAVINGS, `500000`
      otherwise). Move them to `AccountProperties`: `account.daily-limit.savings:
      ${ACCOUNT_DAILY_LIMIT_SAVINGS:100000}` etc., and add the variables to `.env.example` + `.env`.

### 10. Geographical fraud check
- [ ] Removed for now - needs location data. Plan: api-gateway sets `X-Client-IP`, transaction-service adds
      `clientIp` to `TransactionInitiatedEvent`, fraud-detection-service resolves it with MaxMind GeoLite2 and
      flags "impossible travel" / new country against the last location stored in Redis.

---

## Low priority / clean-up

- [ ] **PII in logs:** `AccountService.createAccount` logs the full email. Mask it
      (`a***@example.com`) or log the account number instead.
- [ ] **`AccountServiceApplication.main`:** replace `System.out.println("AccountServiceApplication working 🪄")`
      with `log.info(...)` or remove it.
- [ ] **Balance endpoint:** `GET /api/v1/accounts/{accountNumber}/balance` returns a bare number. Consider
      `BalanceResponse(String accountNumber, BigDecimal balance)` so fields can be added later.
- [ ] **Path variable validation:** validate 12-digit `accountNumber` path variables and return 400 instead
      of a DB lookup.
- [ ] **Minimum balance after debits:** decide whether a deduct may take the balance below the account type's
      minimum balance (Indian banks usually allow it with a penalty) - today it can.
- [ ] **payment-service errors:** it has no `GlobalExceptionHandler` yet, so errors are Spring's default JSON
      instead of RFC 9457 `ProblemDetail` like the other services.
- [ ] **OTP over Kafka:** the plain OTP travels in `transaction.otp.generated` (needed by notification-service).
      Restrict who can read that topic (Kafka ACLs) once security is set up.

---

## Frontend (`frontend/`)

The customer app is at `/app`: overview, transfer (with the OTP step), add money, transaction history
and detail, and the accounts on this device. Everything goes through the BFF proxy to the api-gateway.
Details: `/v1/admin/docs-ui/frontend/banking-app`.

### 11. What the UI needs from the backend
- [ ] **Paging and filtering on the history endpoint.** `GET /v1/transactions/account/{n}/history`
      returns every transaction; the table filters and pages in the browser. Fine for a test account,
      not for a real one. Add `page`, `size`, `status` and `from`/`to` parameters and switch the table
      to its server mode (it already supports `total` + `onPageChange`).
- [ ] **A payment status endpoint.** After Checkout the UI can only say "submitted": there is no
      `GET /v1/payments/{id}`, so it cannot show when the webhook has marked the payment COMPLETED.
      Add one and the "Add money" screen can poll it like a transfer.
- [ ] **A balance response object.** `GET /v1/accounts/{n}/balance` returns a bare number (also in the
      low-priority list below). The UI reads the balance off the account instead.

### 12. Frontend work still open
- [ ] Sign-in screen exists at `/sign-in` but authenticates nobody and nothing links to it. Wire it up
      with item 3, then replace the account switcher with the session.
- [ ] No end-to-end tests yet (Playwright is installed). The transfer + OTP flow is the one to cover.
- [ ] `frontend/.env` points `API_GATEWAY_URL` at `host.docker.internal`, which is right for
      `docker compose up` but not for `pnpm dev` on the host - run that with
      `API_GATEWAY_URL=http://localhost:8080`.

---

## Done (for reference)

- **Fraud detection:** compiles and starts; reads `transaction.initiated`; velocity / amount / balance checks
  with settings from `.env`; publishes `fraud.check.clean` or `verification.required`.
- **OTP:** generated in transaction-service, stored as a SHA-256 hash in Redis with expiry; 3 wrong attempts ->
  FLAGGED + refund + `fraud.detected`; replayed OTP -> 409.
- **Events:** transaction-service publishes `transaction.initiated / completed / refunded`, `fraud.detected`
  and `transaction.otp.generated`; payment-service publishes `payment.completed / failed`;
  notification-service alerts on all of them.
- **`fraud.detected` blocks the sender** (not the receiver); BLOCKED accounts still accept refunds.
- **No double credit:** account-service no longer credits the receiver on `transaction.completed`
  (transaction-service already credits via Feign).
- **Payments:** Razorpay SDK + shared `RazorpayClient`; webhook signature verified; idempotent webhooks;
  captured amount checked; paise conversion exact.
- **api-gateway:** Redis-backed rate limit per client IP (20 burst, 10/s, from `.env`) - tested: 429 when exceeded.
- **Swagger:** combined UI at `http://localhost:8080/swagger-ui.html` lists Account, Transaction and Payment;
  `/internal/**` endpoints are not exposed.
- **Internal endpoints:** transaction-service calls account-service on `/internal/v1/accounts/...`; no
  `/internal/**` route on the gateway.
- **Kafka:** every consumer reads JSON as a Map and sends failing messages to `<topic>-dlt` after 3 retries.
- **Customer UI:** `/app` built against the three client-facing services and tested in the browser -
  open account, add an existing account, transfer, OTP (wrong code and right code), history with
  filters, transaction detail, Razorpay Checkout. 115 frontend tests, `pnpm check` and `pnpm build`
  green. Fraud-detection and notification-service stay internal: no screens.
- **CSP:** `next.config.ts` now sends a Content-Security-Policy that allows Razorpay Checkout
  (script, frame, images, calls) and nothing else third-party.
