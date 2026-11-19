-- Runs once, when the postgres-data volume is empty, as POSTGRES_USER (aegisuser).
-- One database per service (Phase 1); all owned by the single app user.
-- Fraud Detection and Notification have no database.
-- Need another database later? Connect as aegisuser and run: CREATE DATABASE my_db;
CREATE DATABASE account_db;
CREATE DATABASE transaction_db;
CREATE DATABASE payment_db;
