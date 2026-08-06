export type ArchitectureLayer = {
  id: string;
  name: string;
  services: { name: string; description: string }[];
};

export type Architecture = {
  id: string;
  title: string;
  subtitle: string;
  cloud: "AWS" | "GCP";
  cloudColor: "orange" | "blue";
  summary: string;
  overview: string;
  highlightServices: string[];
  diagramImage?: string;
  diagramAlt?: string;
  layers: ArchitectureLayer[];
  dataFlow: { step: number; label: string; detail: string }[];
  decisions: { title: string; body: string }[];
};

export const architectures: Architecture[] = [
  {
    id: "financial-billing",
    title: "Financial Billing",
    subtitle: "Event-driven subscription and usage billing",
    cloud: "AWS",
    cloudColor: "orange",
    summary:
      "Scalable billing platform for usage-based and subscription models with payment reconciliation.",
    overview:
      "An event-driven billing architecture that ingests usage signals, rates and prorates charges, generates invoices, processes payments, and posts to the general ledger. Built for high throughput, idempotent processing, and auditability across regulated FinTech workloads.",
    highlightServices: ["API Gateway", "Step Functions", "DynamoDB", "EventBridge"],
    diagramImage: "/images/architecture/financial-billing-archi.png",
    diagramAlt:
      "AWS event-driven subscription and usage billing architecture — channels, ingestion, billing engine, payments, data store, and observability",
    layers: [
      {
        id: "channels",
        name: "Channels",
        services: [
          { name: "API Gateway", description: "REST/GraphQL APIs for billing operations and customer portal" },
          { name: "CloudFront", description: "CDN for customer-facing billing portal and invoice downloads" },
          { name: "WAF", description: "Web application firewall protecting billing endpoints" },
        ],
      },
      {
        id: "ingestion",
        name: "Event Ingestion",
        services: [
          { name: "EventBridge", description: "Event bus routing usage, subscription, and payment events" },
          { name: "Kinesis Data Streams", description: "High-throughput stream for real-time usage metering" },
          { name: "SQS", description: "Buffered queues with dead-letter for retry and backpressure" },
        ],
      },
      {
        id: "engine",
        name: "Billing Engine",
        services: [
          { name: "Lambda", description: "Rating, proration, tax calculation, and invoice generation" },
          { name: "Step Functions", description: "Orchestration of multi-step billing workflows" },
          { name: "Amazon ECS", description: "Containerised rating engine for complex pricing rules" },
        ],
      },
      {
        id: "payments",
        name: "Payments",
        services: [
          { name: "Payment Gateway", description: "Stripe/Adyen integration via secure webhook handlers" },
          { name: "SQS DLQ", description: "Dead-letter queue for failed payment reconciliation" },
          { name: "Secrets Manager", description: "Secure storage for payment provider credentials" },
        ],
      },
      {
        id: "storage",
        name: "Data Store",
        services: [
          { name: "DynamoDB", description: "Invoices, subscriptions, and usage records with TTL" },
          { name: "RDS Aurora", description: "Relational store for GL sync and financial reporting" },
          { name: "S3", description: "PDF invoice storage with lifecycle policies" },
        ],
      },
      {
        id: "observability",
        name: "Observability & Ops",
        services: [
          { name: "CloudWatch", description: "Metrics, alarms, and structured billing event logs" },
          { name: "X-Ray", description: "Distributed tracing across billing pipeline" },
          { name: "AWS Config", description: "Compliance and configuration drift monitoring" },
        ],
      },
    ],
    dataFlow: [
      { step: 1, label: "Usage event ingestion", detail: "Metering agents publish usage records to Kinesis; EventBridge routes to rating queue." },
      { step: 2, label: "Rating & proration", detail: "Step Functions orchestrate Lambda/ECS rating engine applying pricing tiers and discounts." },
      { step: 3, label: "Invoice generation", detail: "Invoice created in DynamoDB; PDF rendered and stored in S3; customer notified." },
      { step: 4, label: "Payment collection", detail: "Payment gateway charged; webhook confirms success or triggers retry via SQS DLQ." },
      { step: 5, label: "GL posting", detail: "Revenue recognition entries synced to Aurora for finance reconciliation." },
      { step: 6, label: "Customer notification", detail: "Receipt and invoice delivered via SNS/SES; audit trail logged to CloudWatch." },
    ],
    decisions: [
      {
        title: "Event-driven over batch",
        body: "Usage metering requires near-real-time processing. EventBridge + Kinesis decouple producers from the billing engine and allow independent scaling.",
      },
      {
        title: "Step Functions for orchestration",
        body: "Billing workflows span rating, tax, invoice, and payment steps with compensating transactions. Step Functions provide visual audit trails and built-in retry logic.",
      },
      {
        title: "Dual storage pattern",
        body: "DynamoDB handles high-volume transactional billing data; Aurora provides relational integrity for GL sync and regulatory reporting queries.",
      },
    ],
  },
  {
    id: "financial-reporting",
    title: "Financial Reporting",
    subtitle: "Analytics warehouse and executive dashboards",
    cloud: "GCP",
    cloudColor: "blue",
    summary:
      "End-to-end reporting pipeline from source systems to curated marts and Looker dashboards.",
    overview:
      "A modern analytics architecture that extracts data from operational systems, transforms it through a medallion pipeline, builds curated financial marts in BigQuery, and delivers governed reports via Looker. Designed for self-service analytics with enterprise-grade data governance.",
    highlightServices: ["BigQuery", "Dataflow", "Looker", "Pub/Sub"],
    diagramImage: "/images/architecture/financial-reporting-archi.png",
    diagramAlt:
      "GCP financial reporting architecture — sources, ingestion, BigQuery warehouse, Looker semantic layer, delivery, and governance",
    layers: [
      {
        id: "sources",
        name: "Sources",
        services: [
          { name: "Cloud SQL", description: "Operational databases — ERP, CRM, and billing replicas" },
          { name: "GCS Data Lake", description: "Raw landing zone for CSV, JSON, and Parquet extracts" },
          { name: "Billing DB Replica", description: "Read replica for near-real-time revenue data" },
        ],
      },
      {
        id: "ingestion",
        name: "Ingestion & Transform",
        services: [
          { name: "Pub/Sub", description: "Event-driven triggers for incremental data loads" },
          { name: "Dataflow", description: "Managed Apache Beam pipelines for ETL/ELT" },
          { name: "dbt on BigQuery", description: "SQL transformations with version control and testing" },
        ],
      },
      {
        id: "warehouse",
        name: "Warehouse",
        services: [
          { name: "BigQuery", description: "Curated marts: P&L, AR/AP, cash flow, and budget vs actual" },
          { name: "BigQuery Views", description: "Materialised views for frequently accessed aggregates" },
        ],
      },
      {
        id: "semantic",
        name: "Semantic Layer",
        services: [
          { name: "Looker Models", description: "Business-friendly metrics and dimensions with row-level security" },
          { name: "BigQuery Views", description: "Shared definitions for consistent KPI calculations" },
        ],
      },
      {
        id: "delivery",
        name: "Delivery",
        services: [
          { name: "Looker Dashboards", description: "Executive and operational financial dashboards" },
          { name: "Google Sheets Export", description: "Scheduled exports for ad-hoc analysis" },
          { name: "Cloud Run API", description: "Embedded reports for customer-facing portals" },
        ],
      },
      {
        id: "governance",
        name: "Governance",
        services: [
          { name: "Dataplex", description: "Data quality rules, lineage, and cataloguing" },
          { name: "IAM", description: "Fine-grained access control by role and data domain" },
          { name: "Cloud Audit Logs", description: "Immutable audit trail for data access and changes" },
        ],
      },
    ],
    dataFlow: [
      { step: 1, label: "Source extract", detail: "Scheduled and event-driven extracts from Cloud SQL and billing replicas land in GCS." },
      { step: 2, label: "Staging", detail: "Dataflow pipelines cleanse, deduplicate, and load raw data into BigQuery staging tables." },
      { step: 3, label: "Mart build", detail: "dbt transforms staging into curated marts — P&L, AR/AP, cash flow with data quality tests." },
      { step: 4, label: "Semantic model", detail: "Looker models define business metrics with row-level security by department." },
      { step: 5, label: "Report delivery", detail: "Scheduled dashboards, Sheets exports, and Cloud Run API serve stakeholders on cadence." },
    ],
    decisions: [
      {
        title: "Medallion architecture",
        body: "Bronze (raw) → Silver (cleansed) → Gold (curated marts) layers provide clear data lineage and allow reprocessing without touching source systems.",
      },
      {
        title: "dbt for transformations",
        body: "SQL-based transformations with version control, testing, and documentation integrate natively with BigQuery and support finance team collaboration.",
      },
      {
        title: "Looker semantic layer",
        body: "Centralised metric definitions prevent report sprawl and ensure CFO, controller, and ops teams see consistent numbers.",
      },
    ],
  },
  {
    id: "stock-agent",
    title: "Stock Market Agent",
    subtitle: "AI agent monitoring 10 companies",
    cloud: "GCP",
    cloudColor: "blue",
    summary:
      "Scheduled agent that checks market signals for 10 companies and delivers a consolidated report.",
    overview:
      "A lightweight AI agent architecture that runs on a schedule, uses Vertex AI with Gemini function calling to orchestrate market data checks across 10 companies, caches results to avoid rate limits, and stores run history with optional email delivery. Ideal for portfolio monitoring or research automation.",
    highlightServices: ["Vertex AI", "Cloud Functions", "Cloud Scheduler", "Firestore"],
    diagramImage: "/images/architecture/stock-market-agent-archi.png",
    diagramAlt:
      "GCP stock market agent architecture — Cloud Scheduler, Vertex AI agent, market data tools, Redis cache, and report delivery",
    layers: [
      {
        id: "trigger",
        name: "Trigger",
        services: [
          { name: "Cloud Scheduler", description: "Cron-based daily or weekly job trigger" },
        ],
      },
      {
        id: "orchestration",
        name: "Agent Orchestration",
        services: [
          { name: "Vertex AI Agent Builder", description: "Agent framework with tool-use and reasoning" },
          { name: "Gemini", description: "LLM with function calling for structured market analysis" },
        ],
      },
      {
        id: "tools",
        name: "Tools",
        services: [
          { name: "Cloud Functions", description: "Market data fetch — price, volume, news sentiment" },
          { name: "Secret Manager", description: "API keys for market data providers (Alpha Vantage, etc.)" },
        ],
      },
      {
        id: "cache",
        name: "Cache",
        services: [
          { name: "Memorystore Redis", description: "Cache market data to respect API rate limits" },
        ],
      },
      {
        id: "output",
        name: "Output",
        services: [
          { name: "Firestore", description: "Run history, agent decisions, and audit log" },
          { name: "Cloud Storage", description: "JSON report artefacts per run" },
          { name: "Pub/Sub → SendGrid", description: "Optional email delivery of consolidated report" },
        ],
      },
      {
        id: "observability",
        name: "Observability",
        services: [
          { name: "Cloud Logging", description: "Structured logs for agent steps and tool invocations" },
          { name: "Error Reporting", description: "Alerting on agent failures and API errors" },
        ],
      },
    ],
    dataFlow: [
      { step: 1, label: "Schedule trigger", detail: "Cloud Scheduler invokes the agent workflow at configured cadence (e.g. daily 6 AM)." },
      { step: 2, label: "Agent orchestration", detail: "Vertex AI Agent receives prompt to check 10 companies; plans tool calls via Gemini." },
      { step: 3, label: "Market data fetch", detail: "Cloud Functions fetch price, volume, and news for each company; Redis caches recent data." },
      { step: 4, label: "Aggregate signals", detail: "Agent synthesises findings — price movement, volume spikes, sentiment — into structured report." },
      { step: 5, label: "Store & notify", detail: "Report saved to Firestore and GCS; optional email sent via Pub/Sub to SendGrid." },
    ],
    decisions: [
      {
        title: "Agent over fixed pipeline",
        body: "An agent adapts to varying market conditions and can reason about which checks matter per company, unlike a rigid ETL script.",
      },
      {
        title: "Redis for rate limiting",
        body: "Market data APIs have strict quotas. Caching in Memorystore reduces redundant calls and keeps the agent within limits.",
      },
      {
        title: "Firestore for run history",
        body: "Document store suits append-only run logs and enables quick lookup of past agent decisions for audit and tuning.",
      },
    ],
  },
  {
    id: "ledger-validation",
    title: "Ledger Validation",
    subtitle: "Automated GL checks for a small company",
    cloud: "AWS",
    cloudColor: "orange",
    summary:
      "Upload ledger entries, validate debit/credit balance and rules, triage exceptions, and audit.",
    overview:
      "An automated ledger validation pipeline for small companies that ingests GL entries from ERP exports, runs parallel validation rules (debit/credit balance, account mapping, period close), routes exceptions for triage, maintains an immutable audit trail, and surfaces open items to finance via QuickSight.",
    highlightServices: ["Step Functions", "Lambda", "S3 Object Lock", "QuickSight"],
    diagramImage: "/images/architecture/ledger-validation-archi.png",
    diagramAlt:
      "AWS ledger validation architecture — S3 ingestion, Lambda validation, Step Functions orchestration, audit storage, and QuickSight reporting",
    layers: [
      {
        id: "ingestion",
        name: "Ingestion",
        services: [
          { name: "S3 Landing", description: "CSV/JSON uploads from ERP or accounting system" },
          { name: "EventBridge", description: "S3 object-created events trigger validation pipeline" },
        ],
      },
      {
        id: "validation",
        name: "Validation Engine",
        services: [
          { name: "Lambda", description: "Debit/credit balance, account mapping, period close rules" },
          { name: "Lambda", description: "Duplicate entry detection and cross-reference checks" },
        ],
      },
      {
        id: "orchestration",
        name: "Orchestration",
        services: [
          { name: "Step Functions", description: "Parallel validation branches with exception routing" },
        ],
      },
      {
        id: "anomaly",
        name: "Anomaly Detection",
        services: [
          { name: "SageMaker", description: "Optional ML scoring for unusual entry patterns" },
        ],
      },
      {
        id: "audit",
        name: "Audit & Storage",
        services: [
          { name: "S3 Object Lock", description: "Immutable audit trail for compliance" },
          { name: "DynamoDB", description: "Exception registry with status and assignee" },
        ],
      },
      {
        id: "reporting",
        name: "Reporting",
        services: [
          { name: "QuickSight", description: "Dashboard for open exceptions and validation trends" },
          { name: "SNS", description: "Alerts to finance team on critical exceptions" },
        ],
      },
    ],
    dataFlow: [
      { step: 1, label: "Ledger upload", detail: "Finance uploads CSV/JSON export to S3 landing bucket; EventBridge triggers pipeline." },
      { step: 2, label: "Rule validation", detail: "Step Functions run parallel Lambda validators — balance, mapping, period close." },
      { step: 3, label: "Exception triage", detail: "Failed rules routed to DynamoDB exception registry; SageMaker flags anomalies." },
      { step: 4, label: "Audit log", detail: "All validation results written to S3 Object Lock for immutable audit." },
      { step: 5, label: "Finance dashboard", detail: "QuickSight shows open exceptions; SNS alerts assigned reviewers." },
    ],
    decisions: [
      {
        title: "Step Functions for parallel validation",
        body: "Multiple rule sets (balance, mapping, duplicates) run in parallel; failures are isolated and routed without blocking other checks.",
      },
      {
        title: "S3 Object Lock for audit",
        body: "Regulatory and internal audit requirements demand tamper-proof records. Object Lock provides WORM storage for validation history.",
      },
      {
        title: "Exception registry in DynamoDB",
        body: "Fast lookups and status updates for triage workflow; finance can assign, resolve, and track exceptions without querying raw files.",
      },
    ],
  },
];

export function getArchitectureById(id: string): Architecture | undefined {
  return architectures.find((a) => a.id === id);
}
