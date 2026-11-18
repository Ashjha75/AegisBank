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
---
