# Financial Reporting Architecture

## Overview

Reference architecture for an end-to-end financial reporting pipeline on Google Cloud Platform (GCP). Data flows from operational source systems through a medallion-style analytics pipeline into curated financial marts and Looker dashboards.

This is a **reference architecture** published on Adritash.com — not a named client deployment.

## Business Problem

Finance and operations teams need reliable, governed financial reporting (P&L, AR/AP, cash flow, budget vs actual) without inconsistent metrics across spreadsheets and ad-hoc reports.

## Solution

A modern analytics architecture that extracts data from operational systems, transforms it through staging and curated layers, builds financial marts in BigQuery, and delivers governed reports via Looker with enterprise data governance.

## Architecture

### Sources

- Cloud SQL — operational databases (ERP, CRM, billing replicas)
- GCS Data Lake — raw landing zone for CSV, JSON, and Parquet extracts
- Billing DB Replica — near-real-time revenue data

### Ingestion & Transform

- Pub/Sub — event-driven triggers for incremental loads
- Dataflow — managed Apache Beam pipelines for ETL/ELT
- dbt on BigQuery — SQL transformations with version control and testing

### Warehouse

- BigQuery — curated marts: P&L, AR/AP, cash flow, budget vs actual
- BigQuery materialised views — frequently accessed aggregates

### Semantic Layer

- Looker models — business-friendly metrics and dimensions with row-level security
- BigQuery views — shared KPI definitions

### Delivery

- Looker dashboards — executive and operational financial dashboards
- Google Sheets export — scheduled exports for ad-hoc analysis
- Cloud Run API — embedded reports for customer-facing portals

### Governance

- Dataplex — data quality rules, lineage, and cataloguing
- IAM — fine-grained access control by role and data domain
- Cloud Audit Logs — immutable audit trail for data access

## Technology

**Primary stack:** GCP, BigQuery, Dataflow, Pub/Sub, dbt, Looker, Cloud SQL, GCS, Dataplex, Cloud Run, Google Sheets

## Data Flow

1. Scheduled and event-driven extracts from Cloud SQL and billing replicas land in GCS.
2. Dataflow pipelines cleanse, deduplicate, and load raw data into BigQuery staging tables.
3. dbt transforms staging into curated marts with data quality tests.
4. Looker models define business metrics with row-level security by department.
5. Dashboards, Sheets exports, and Cloud Run API serve stakeholders on cadence.

## Key Design Decisions

- **Medallion architecture** — Bronze (raw) → Silver (cleansed) → Gold (curated marts) for clear lineage and reprocessing.
- **dbt for transformations** — SQL-based transforms with version control and testing, native to BigQuery.
- **Looker semantic layer** — centralised metric definitions prevent report sprawl.

## Benefits

- Self-service analytics with enterprise-grade governance
- Consistent KPIs across finance and operations stakeholders
- Clear lineage from source systems to executive dashboards

## Relevant Services

- Application Architecture
- Cloud Migration (GCP)
- AI Architecture (for future intelligent reporting assistants)

## Limitations / Assumptions

- Reference architecture only; not tied to a specific client or production deployment.
- Technology choices assume GCP as the primary cloud provider for this pattern.
