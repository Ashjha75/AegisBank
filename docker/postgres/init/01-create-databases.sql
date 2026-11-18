-- Runs once, when the postgres-data volume is empty.
-- One database per service (Phase 1). Fraud Detection and Notification have no database.
CREATE DATABASE account_db;
CREATE DATABASE transaction_db;
CREATE DATABASE payment_db;
