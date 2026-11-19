# AGENTS.md

Instructions for AI coding agents (Claude Code, Codex, Copilot, etc.) working in this repository.

## Git workflow - read this first

- **Work directly on the `dev_v1` branch in the main checkout** (the repository root that is open in IntelliJ).
- **Never create or use git worktrees.** Do not call `EnterWorktree`, do not run `git worktree add`,
  and do not work under `.claude/worktrees/`. This applies to background/async sessions too.
- **Do not create new branches** unless the owner explicitly asks for one.
- Edit files in place so changes are immediately visible in the IDE - the owner must never have to
  ask for a merge.
- **Do not commit or push** unless explicitly asked. Leave changes uncommitted for review.
- Never force-push, rebase shared history, or run destructive git commands (`reset --hard`,
  `clean -fd`, `checkout -- .`) without explicit approval.
- The owner may be editing files at the same time: re-read a file right before changing it and
  never overwrite their in-progress work.

## Project overview

AegisBank - event-driven banking microservices (Java 25, Spring Boot 4, Maven multi-module).

| Module | Port | Infra |
|--------|------|-------|
| api-gateway | 8080 | Redis |
| account-service | 8081 | Postgres `account_db`, Kafka |
| transaction-service | 8082 | Postgres `transaction_db`, Kafka, OpenFeign |
| payment-service | 8083 | Postgres `payment_db`, Kafka, Razorpay |
| fraud-detection-service | 8084 | Redis, Kafka |
| notification-service | 8085 | Kafka, Mail |

Package root per service: `com.banking.<servicename>` (e.g. `com.banking.accountservice`), with
sub-packages `controller`, `service`, `repository`, `entity`, `dto`, `config`, `exception`, `validation`.

## Commands

- Infrastructure: `docker compose up -d` (Postgres, Redis, Kafka, Zookeeper, Adminer on :8090)
- Build + test everything: `./mvnw clean package` (from the repo root)
- One service: `./mvnw -pl account-service test` / `./mvnw -pl account-service spring-boot:run`
- Tests need Docker infrastructure running and each service's `.env` present.

## Configuration

- Root `.env` -> docker compose. `<service>/.env` -> that service (loaded via
  `spring.config.import`, required). Templates: `.env.example` (committed).
- Never commit `.env` files or put secrets/default passwords in `application.yml`.
- When adding a config value: add it to `application.yml` as `${VAR}`, to the service's
  `.env.example` with a comment, and to the local `.env`.

## Code conventions

- Request/response DTOs are Java `record`s with Bean Validation annotations.
- Never return JPA entities from controllers - map to a response DTO.
- Money is `BigDecimal` (never `double`), columns `precision = 15, scale = 2`.
- Business errors: throw a subclass of `exception.BusinessException`
  (`ResourceNotFoundException`, `ResourceAlreadyExistsException`, ...). `GlobalExceptionHandler`
  turns them into RFC 9457 `ProblemDetail` responses - don't build error responses in controllers.
- Business rules that change per environment (e.g. minimum balances) come from
  `@ConfigurationProperties` backed by `.env`, not hard-coded constants.
- Add or update tests for behaviour you change, and run them before reporting work as done.
