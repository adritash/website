# Ledger Validation Architecture

## Overview

Reference architecture for automated general ledger (GL) validation on AWS. Designed for small companies that need to upload ledger entries, validate debit/credit balance and business rules, triage exceptions, and maintain an audit trail.

This is a **reference architecture** published on Adritash.com.

## Business Problem

Finance teams manually validate GL exports from ERP systems. Errors in debit/credit balance, account mapping, or period-close rules are caught late and are hard to audit.

## Solution

An automated ledger validation pipeline that ingests GL entries from ERP exports, runs parallel validation rules, routes exceptions for triage, maintains an immutable audit trail, and surfaces open items via QuickSight.

## Architecture

### Ingestion

- S3 Landing — CSV/JSON uploads from ERP or accounting system
- EventBridge — S3 object-created events trigger the validation pipeline

### Validation Engine

- AWS Lambda — debit/credit balance, account mapping, period close rules
- AWS Lambda — duplicate entry detection and cross-reference checks

### Orchestration

- AWS Step Functions — parallel validation branches with exception routing

### Anomaly Detection

- Amazon SageMaker — optional ML scoring for unusual entry patterns

### Audit & Storage

- S3 Object Lock — immutable audit trail for compliance
- DynamoDB — exception registry with status and assignee

### Reporting

- Amazon QuickSight — dashboard for open exceptions and validation trends
- Amazon SNS — alerts to finance team on critical exceptions

## Technology

**Primary stack:** AWS, S3, EventBridge, Lambda, Step Functions, SageMaker (optional), DynamoDB, QuickSight, SNS

## Data Flow

1. Finance uploads CSV/JSON export to S3; EventBridge triggers the pipeline.
2. Step Functions run parallel Lambda validators — balance, mapping, period close.
3. Failed rules route to DynamoDB exception registry; SageMaker may flag anomalies.
4. All validation results written to S3 Object Lock for immutable audit.
5. QuickSight shows open exceptions; SNS alerts assigned reviewers.

## Key Design Decisions

- **Step Functions for parallel validation** — rule failures are isolated without blocking other checks.
- **S3 Object Lock for audit** — WORM storage for validation history.
- **DynamoDB exception registry** — fast triage workflow without querying raw files.

## Benefits

- Faster exception detection than manual review
- Tamper-proof audit records
- Finance visibility into open validation items

## Relevant Services

- Application Architecture
- Cloud Migration (AWS)

## Limitations / Assumptions

- Reference architecture for small-company GL validation; not a named client deployment.
- SageMaker anomaly detection is optional.
