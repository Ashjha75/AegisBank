# AegisBank 🏦

A distributed, event-driven digital banking system built with **Java** and **Spring Boot**. AegisBank handles peer-to-peer (P2P) transfers, external merchant checkout flows (via Razorpay), and real-time fraud detection across isolated microservices. 

To maintain strict data consistency across independent databases without traditional monolithic rollbacks, this system implements the **SAGA Design Pattern** with automated compensating transactions.

## 🚀 Core Architecture

* **Microservices:** API Gateway, Account Service, Transaction Service (SAGA Orchestrator), Fraud Detection, Notification, and Payment Service.
* **Event Streaming:** **Apache Kafka** & Zookeeper decouple the services and handle asynchronous event publishing (e.g., `transaction.initiated`, `fraud.detected`).
* **In-Memory Caching & Rules:** **Redis** handles API Gateway rate-limiting, caches short-lived verification OTPs, and executes hyper-fast lookups to track 60-second transaction velocity.
* **Persistent State:** **PostgreSQL** (enforcing one isolated database per microservice) to maintain strict bounded contexts.
* **Infrastructure:** Fully containerized with **Docker** and orchestrated via `docker-compose`.

## 🛡️ Key Features

1. **Real-Time Fraud Engine:** Evaluates in-flight Kafka transaction events against three algorithmic risk patterns (Velocity Tracking, Spiked Average, Wallet Drain) in milliseconds.
2. **Step-Up Verification:** Suspends suspicious transactions in a `PENDING_VERIFICATION` state and forces a Redis-backed OTP flow before completion.
3. **Automated SAGA Rollbacks:** If a transaction fails mid-flight or a user fails OTP verification, the orchestrator triggers an automated compensating event to refund the sender and lock the account.

## 🛠️ Quick Start

1. Clone the repository:
```bash
   git clone [https://github.com/Ashjha75/AegisBank.git](https://github.com/Ashjha75/AegisBank.git)
```
```bash
docker-compose up -d
```

### Project layout

The repo root is a Maven **multi-module** project (`pom.xml` at the root lists every service as a module).
Open the **root folder** in IntelliJ and it imports all six services at once.

| Service                 | Port | Database         | Uses                  |
|-------------------------|------|------------------|-----------------------|
| api-gateway             | 8080 | –                | Redis                 |
| account-service         | 8081 | `account_db`     | Postgres, Kafka       |
| transaction-service     | 8082 | `transaction_db` | Postgres, Kafka, Feign|
| payment-service         | 8083 | `payment_db`     | Postgres, Kafka       |
| fraud-detection-service | 8084 | –                | Redis, Kafka          |
| notification-service    | 8085 | –                | Kafka, Mail           |

Gateway routes: `/api/accounts/**` → account, `/api/transactions/**` → transaction, `/api/payments/**` → payment.
Health check for any service: `http://localhost:<port>/actuator/health`.

### Running locally

1. Start infrastructure: `docker compose up -d` (Postgres, Redis, Kafka, Zookeeper).
2. **IntelliJ:** pick a configuration from the Run dropdown (`AccountService`, `ApiGateway`, …) or **All Services** to start everything.
3. **Command line:** `./mvnw clean package` builds and tests every service from the root;
   `./mvnw -pl account-service spring-boot:run` runs one service.

Every connection setting in `application.yml` can be overridden with environment variables
(`DB_HOST`, `DB_USERNAME`, `DB_PASSWORD`, `KAFKA_BOOTSTRAP_SERVERS`, `REDIS_HOST`, `SERVER_PORT`, …).

### Database login

Postgres has a single user, **`aegisuser`**, used by every service and for any database you create
(default password `Staging123$` — dev only). It owns `aegisbankdb` (default/scratch DB), `account_db`,
`transaction_db` and `payment_db`. To change the password, copy `.env.example` to `.env` and edit
`DB_PASSWORD`, set the same `DB_PASSWORD` env var for the services, then reset the volume (below).

Connect from IntelliJ/DBeaver: `jdbc:postgresql://localhost:5432/<db>` with `aegisuser`.

**Adminer (web UI):** <http://localhost:8090> — System `PostgreSQL`, Server `postgres`,
Username `aegisuser`, Password = your `DB_PASSWORD`, Database `aegisbankdb` (switch DBs from the sidebar).
Need another database? `docker exec postgres psql -U aegisuser -d aegisbankdb -c "CREATE DATABASE my_db;"`

> The user, password and databases are only created when the `postgres-data` volume is empty.
> After changing them, reset it (deletes all DB data):
> `docker compose rm -sf postgres && docker volume rm aegisbank_postgres-data && docker compose up -d postgres`
---
