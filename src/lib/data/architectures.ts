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
  diagramWidth?: number;
  diagramHeight?: number;
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
  {
    id: "ai-invoice-processing",
    title: "AI Invoice Processing",
    subtitle: "Intelligent capture, extraction, and AP workflow",
    cloud: "GCP",
    cloudColor: "blue",
    summary:
      "Automated invoice ingestion with AI extraction, validation, and accounts-payable routing.",
    overview:
      "An AI-powered invoice processing pipeline that ingests PDF and email invoices, extracts line items and totals using Document AI, validates against PO and vendor master data, and routes exceptions to finance for approval before ERP posting.",
    highlightServices: ["Document AI", "Vertex AI", "Cloud Functions", "BigQuery"],
    diagramImage: "/images/architecture/ai-invoice-processing-archi.png",
    diagramAlt: "GCP AI invoice processing architecture — ingestion, extraction, validation, and AP workflow",
    diagramWidth: 1536,
    diagramHeight: 1024,
    layers: [
      {
        id: "ingestion",
        name: "Ingestion",
        services: [
          { name: "Cloud Storage", description: "Landing zone for PDF, image, and email invoice attachments" },
          { name: "Pub/Sub", description: "Event triggers on new invoice upload" },
        ],
      },
      {
        id: "extraction",
        name: "AI Extraction",
        services: [
          { name: "Document AI", description: "OCR and structured extraction of invoice fields" },
          { name: "Vertex AI", description: "LLM validation and anomaly detection on extracted data" },
        ],
      },
      {
        id: "validation",
        name: "Validation",
        services: [
          { name: "Cloud Functions", description: "PO matching, vendor lookup, and duplicate detection" },
          { name: "Cloud SQL", description: "Vendor master and PO reference data" },
        ],
      },
      {
        id: "workflow",
        name: "Workflow",
        services: [
          { name: "Workflows", description: "Exception routing and approval orchestration" },
          { name: "Firestore", description: "Invoice status and audit trail" },
        ],
      },
      {
        id: "output",
        name: "Output",
        services: [
          { name: "ERP Integration", description: "Approved invoices posted to finance system" },
          { name: "BigQuery", description: "AP analytics and spend reporting" },
        ],
      },
    ],
    dataFlow: [
      { step: 1, label: "Invoice intake", detail: "Invoices arrive via email, portal upload, or API into Cloud Storage." },
      { step: 2, label: "AI extraction", detail: "Document AI extracts vendor, line items, tax, and totals; Vertex AI flags anomalies." },
      { step: 3, label: "Validation", detail: "Cloud Functions match against PO and vendor master; duplicates rejected." },
      { step: 4, label: "Approval routing", detail: "Exceptions routed via Workflows to AP team; clean invoices auto-approved." },
      { step: 5, label: "ERP posting", detail: "Approved invoices posted to ERP; metrics land in BigQuery for reporting." },
    ],
    decisions: [
      { title: "Document AI for extraction", body: "Pre-trained invoice parsers reduce custom OCR development and improve accuracy on varied vendor formats." },
      { title: "Human-in-the-loop for exceptions", body: "Low-confidence extractions and PO mismatches route to AP reviewers rather than auto-posting." },
      { title: "Event-driven pipeline", body: "Pub/Sub decouples ingestion from processing so spikes in invoice volume scale independently." },
    ],
  },
  {
    id: "customer-support-ai",
    title: "Customer Support AI",
    subtitle: "Agent-assisted ticketing and knowledge retrieval",
    cloud: "GCP",
    cloudColor: "blue",
    summary:
      "AI agent that triages tickets, retrieves knowledge, and escalates to human agents when needed.",
    overview:
      "A customer support architecture combining Vertex AI agents with a knowledge base, CRM integration, and sentiment analysis. The agent handles tier-1 queries, drafts responses, and escalates complex cases to human agents with full context.",
    highlightServices: ["Vertex AI", "Agent Builder", "Firestore", "Cloud Run"],
    diagramImage: "/images/architecture/customer-support-ai-archi.png",
    diagramAlt: "GCP customer support AI architecture — agent orchestration, knowledge base, and escalation",
    diagramWidth: 2528,
    diagramHeight: 1686,
    layers: [
      {
        id: "channels",
        name: "Channels",
        services: [
          { name: "Cloud Run API", description: "Chat widget and email webhook endpoints" },
          { name: "API Gateway", description: "Rate limiting and authentication for support channels" },
        ],
      },
      {
        id: "agent",
        name: "Agent Layer",
        services: [
          { name: "Vertex AI Agent Builder", description: "Orchestrates tool use and multi-turn conversation" },
          { name: "Gemini", description: "Response generation and intent classification" },
        ],
      },
      {
        id: "knowledge",
        name: "Knowledge & Tools",
        services: [
          { name: "Vertex AI Search", description: "RAG over product docs, FAQs, and runbooks" },
          { name: "Cloud Functions", description: "CRM lookup, order status, and ticket creation tools" },
        ],
      },
      {
        id: "storage",
        name: "Storage",
        services: [
          { name: "Firestore", description: "Conversation history and ticket state" },
          { name: "Cloud Storage", description: "Knowledge base documents and attachments" },
        ],
      },
      {
        id: "escalation",
        name: "Escalation & Ops",
        services: [
          { name: "Pub/Sub", description: "Escalation events to human agent queue" },
          { name: "Cloud Logging", description: "Conversation audit and quality monitoring" },
        ],
      },
    ],
    dataFlow: [
      { step: 1, label: "Customer query", detail: "User submits question via chat or email; API Gateway routes to agent service." },
      { step: 2, label: "Intent & retrieval", detail: "Agent classifies intent and retrieves relevant knowledge via Vertex AI Search." },
      { step: 3, label: "Tool invocation", detail: "Agent calls Cloud Functions for order lookup, account info, or ticket creation." },
      { step: 4, label: "Response or escalate", detail: "Confident answers returned directly; low-confidence cases escalated with context." },
      { step: 5, label: "Audit & improve", detail: "Conversations logged to Firestore; metrics feed agent tuning and reporting." },
    ],
    decisions: [
      { title: "RAG over fine-tuning", body: "Knowledge base retrieval keeps answers current without retraining when docs change." },
      { title: "Escalation with context", body: "Human agents receive full conversation history and retrieved sources to avoid repeat questions." },
      { title: "Tool-use pattern", body: "Function calling connects the agent to live CRM and order data instead of static responses only." },
    ],
  },
  {
    id: "document-approval-workflow",
    title: "Document Approval Workflow",
    subtitle: "Multi-stage review and sign-off automation",
    cloud: "AWS",
    cloudColor: "orange",
    summary:
      "Route documents through configurable approval chains with notifications and audit trails.",
    overview:
      "A document approval workflow that ingests submissions, routes them through multi-level approvers based on rules, captures digital sign-offs, and maintains a complete audit trail for compliance.",
    highlightServices: ["Step Functions", "Lambda", "S3", "DynamoDB"],
    diagramImage: "/images/architecture/document-approval-workflow-archi.png",
    diagramAlt: "AWS document approval workflow architecture — routing, approvals, and audit",
    diagramWidth: 2528,
    diagramHeight: 1686,
    layers: [
      {
        id: "ingestion",
        name: "Ingestion",
        services: [
          { name: "S3", description: "Document upload and version storage" },
          { name: "API Gateway", description: "Submission and status APIs" },
        ],
      },
      {
        id: "routing",
        name: "Routing Engine",
        services: [
          { name: "Lambda", description: "Approval chain resolution based on document type and value" },
          { name: "DynamoDB", description: "Workflow state and approver assignments" },
        ],
      },
      {
        id: "orchestration",
        name: "Orchestration",
        services: [
          { name: "Step Functions", description: "Multi-stage approval workflow with timeouts and reminders" },
        ],
      },
      {
        id: "notification",
        name: "Notifications",
        services: [
          { name: "SNS", description: "Email and SMS alerts to approvers" },
          { name: "SES", description: "Approval request and decision notifications" },
        ],
      },
      {
        id: "audit",
        name: "Audit",
        services: [
          { name: "S3 Object Lock", description: "Immutable audit log of all decisions" },
          { name: "CloudWatch", description: "Workflow metrics and SLA monitoring" },
        ],
      },
    ],
    dataFlow: [
      { step: 1, label: "Document submit", detail: "User uploads document via portal; metadata stored in DynamoDB." },
      { step: 2, label: "Chain resolution", detail: "Lambda determines approver chain based on document type, department, and amount." },
      { step: 3, label: "Sequential approval", detail: "Step Functions routes to each approver; SNS sends notification with action link." },
      { step: 4, label: "Decision capture", detail: "Approve/reject recorded with timestamp; next stage triggered or workflow completes." },
      { step: 5, label: "Audit archive", detail: "Final document and decision trail written to S3 Object Lock for compliance." },
    ],
    decisions: [
      { title: "Step Functions for approvals", body: "Visual workflow with built-in wait states, timeouts, and parallel branches suits multi-level sign-off." },
      { title: "Configurable routing rules", body: "Lambda resolves approver chains from DynamoDB rules without code changes per document type." },
      { title: "Immutable audit trail", body: "S3 Object Lock ensures approval decisions cannot be altered after the fact." },
    ],
  },
  {
    id: "employee-onboarding",
    title: "Employee Onboarding",
    subtitle: "Automated provisioning and checklist workflow",
    cloud: "AWS",
    cloudColor: "orange",
    summary:
      "End-to-end onboarding from offer acceptance through IT provisioning and HR compliance.",
    overview:
      "An employee onboarding platform that triggers workflows on hire events, provisions accounts and equipment, assigns training modules, and tracks checklist completion across HR, IT, and facilities teams.",
    highlightServices: ["Step Functions", "Lambda", "EventBridge", "DynamoDB"],
    diagramImage: "/images/architecture/employee-onboarding-archi.png",
    diagramAlt: "AWS employee onboarding architecture — provisioning, checklists, and compliance",
    diagramWidth: 2528,
    diagramHeight: 1686,
    layers: [
      {
        id: "trigger",
        name: "Trigger",
        services: [
          { name: "EventBridge", description: "Hire event from HRIS or ATS integration" },
          { name: "API Gateway", description: "Manual onboarding initiation API" },
        ],
      },
      {
        id: "orchestration",
        name: "Orchestration",
        services: [
          { name: "Step Functions", description: "Parallel onboarding tasks across HR, IT, and facilities" },
          { name: "Lambda", description: "Task handlers for each onboarding step" },
        ],
      },
      {
        id: "provisioning",
        name: "IT Provisioning",
        services: [
          { name: "Lambda", description: "AD/SSO account creation, email, and laptop assignment" },
          { name: "Secrets Manager", description: "Integration credentials for identity systems" },
        ],
      },
      {
        id: "tracking",
        name: "Tracking",
        services: [
          { name: "DynamoDB", description: "Onboarding checklist state per employee" },
          { name: "S3", description: "Signed documents and policy acknowledgements" },
        ],
      },
      {
        id: "notification",
        name: "Notifications",
        services: [
          { name: "SNS", description: "Alerts to hiring manager and new hire" },
          { name: "SES", description: "Welcome emails and task reminders" },
        ],
      },
    ],
    dataFlow: [
      { step: 1, label: "Hire event", detail: "HRIS publishes hire event to EventBridge; onboarding workflow starts." },
      { step: 2, label: "Parallel tasks", detail: "Step Functions launches IT provisioning, HR paperwork, and facilities setup in parallel." },
      { step: 3, label: "IT provisioning", detail: "Lambda creates accounts, assigns equipment, and grants application access." },
      { step: 4, label: "Checklist tracking", detail: "Each completed task updates DynamoDB; manager dashboard shows progress." },
      { step: 5, label: "Completion", detail: "All tasks done; welcome notification sent; audit record archived to S3." },
    ],
    decisions: [
      { title: "Event-driven start", body: "EventBridge integration with HRIS eliminates manual onboarding initiation and reduces day-one delays." },
      { title: "Parallel task execution", body: "IT, HR, and facilities workstreams run concurrently to shorten time-to-productivity." },
      { title: "Centralised checklist", body: "DynamoDB provides a single source of truth for onboarding status visible to all stakeholders." },
    ],
  },
  {
    id: "expense-claim-automation",
    title: "Expense Claim Automation",
    subtitle: "Receipt capture, policy checks, and reimbursement",
    cloud: "AWS",
    cloudColor: "orange",
    summary:
      "Automated expense submission with receipt OCR, policy validation, and approval routing.",
    overview:
      "An expense management pipeline where employees submit claims with receipt photos, Textract extracts amounts, policy rules validate limits and categories, and approved claims flow to payroll for reimbursement.",
    highlightServices: ["Textract", "Step Functions", "Lambda", "DynamoDB"],
    diagramImage: "/images/architecture/expense-claim-automation-archi.png",
    diagramAlt: "AWS expense claim automation architecture — OCR, policy validation, and reimbursement",
    diagramWidth: 2528,
    diagramHeight: 1686,
    layers: [
      {
        id: "submission",
        name: "Submission",
        services: [
          { name: "API Gateway", description: "Mobile and web expense submission APIs" },
          { name: "S3", description: "Receipt image storage" },
        ],
      },
      {
        id: "extraction",
        name: "OCR & Extraction",
        services: [
          { name: "Textract", description: "Receipt OCR for amount, date, and merchant" },
          { name: "Lambda", description: "Field normalisation and currency conversion" },
        ],
      },
      {
        id: "validation",
        name: "Policy Validation",
        services: [
          { name: "Lambda", description: "Per-diem limits, category rules, and duplicate detection" },
          { name: "DynamoDB", description: "Policy rules and claim state" },
        ],
      },
      {
        id: "approval",
        name: "Approval",
        services: [
          { name: "Step Functions", description: "Manager approval workflow with escalation" },
          { name: "SNS", description: "Approval request notifications" },
        ],
      },
      {
        id: "payment",
        name: "Reimbursement",
        services: [
          { name: "Lambda", description: "Payroll file generation for approved claims" },
          { name: "S3", description: "Reimbursement batch archive" },
        ],
      },
    ],
    dataFlow: [
      { step: 1, label: "Claim submit", detail: "Employee uploads receipt and category via mobile app; image stored in S3." },
      { step: 2, label: "OCR extraction", detail: "Textract extracts amount and merchant; Lambda normalises fields." },
      { step: 3, label: "Policy check", detail: "Lambda validates against per-diem, category, and duplicate rules." },
      { step: 4, label: "Manager approval", detail: "Step Functions routes to manager; SNS sends approval request." },
      { step: 5, label: "Reimbursement", detail: "Approved claims exported to payroll; batch archived in S3." },
    ],
    decisions: [
      { title: "Textract for receipts", body: "Managed OCR handles varied receipt formats without custom image processing pipelines." },
      { title: "Policy engine in Lambda", body: "Rules stored in DynamoDB allow finance to update limits without redeploying code." },
      { title: "Manager escalation", body: "Step Functions handles timeout and escalation when approvers do not respond within SLA." },
    ],
  },
  {
    id: "it-asset-management",
    title: "IT Asset Management",
    subtitle: "Inventory tracking, lifecycle, and compliance",
    cloud: "AWS",
    cloudColor: "orange",
    summary:
      "Track hardware and software assets from procurement through retirement with audit compliance.",
    overview:
      "An IT asset management system that maintains a central inventory of devices and licences, automates discovery scans, tracks assignment and lifecycle events, and generates compliance reports for audits.",
    highlightServices: ["DynamoDB", "Lambda", "EventBridge", "QuickSight"],
    diagramImage: "/images/architecture/it-asset-management-archi.png",
    diagramAlt: "AWS IT asset management architecture — inventory, lifecycle, and compliance reporting",
    diagramWidth: 2528,
    diagramHeight: 1686,
    layers: [
      {
        id: "ingestion",
        name: "Data Ingestion",
        services: [
          { name: "API Gateway", description: "Asset registration and update APIs" },
          { name: "EventBridge", description: "Events from procurement, HR, and MDM systems" },
        ],
      },
      {
        id: "inventory",
        name: "Inventory",
        services: [
          { name: "DynamoDB", description: "Asset registry with assignment and status" },
          { name: "Lambda", description: "Lifecycle state transitions and validation" },
        ],
      },
      {
        id: "discovery",
        name: "Discovery",
        services: [
          { name: "Lambda", description: "Scheduled MDM and network discovery scans" },
          { name: "S3", description: "Discovery scan results and audit logs" },
        ],
      },
      {
        id: "workflow",
        name: "Workflow",
        services: [
          { name: "Step Functions", description: "Procure, assign, return, and retire workflows" },
          { name: "SNS", description: "Alerts for warranty expiry and compliance gaps" },
        ],
      },
      {
        id: "reporting",
        name: "Reporting",
        services: [
          { name: "QuickSight", description: "Asset utilisation and compliance dashboards" },
          { name: "Athena", description: "Ad-hoc queries over S3 audit data" },
        ],
      },
    ],
    dataFlow: [
      { step: 1, label: "Asset register", detail: "New assets registered via API or procurement event on EventBridge." },
      { step: 2, label: "Assignment", detail: "Step Functions handles assign-to-employee workflow; DynamoDB updated." },
      { step: 3, label: "Discovery scan", detail: "Scheduled Lambda reconciles MDM inventory against registry; gaps flagged." },
      { step: 4, label: "Lifecycle events", detail: "Return, repair, and retirement transitions tracked with audit log in S3." },
      { step: 5, label: "Compliance report", detail: "QuickSight dashboards show asset coverage, warranty status, and audit readiness." },
    ],
    decisions: [
      { title: "Event-driven updates", body: "EventBridge integrates HR offboarding and procurement systems to keep inventory current automatically." },
      { title: "Discovery reconciliation", body: "Scheduled scans detect unregistered devices and licence drift before audits." },
      { title: "Lifecycle workflows", body: "Step Functions standardises procure-to-retire processes across IT operations." },
    ],
  },
  {
    id: "leave-approval-system",
    title: "Leave Approval System",
    subtitle: "Request, balance check, and manager approval",
    cloud: "AWS",
    cloudColor: "orange",
    summary:
      "Employee leave requests with balance validation, manager routing, and calendar sync.",
    overview:
      "A leave management workflow where employees submit requests, the system validates available balance and team coverage, routes to managers for approval, and syncs approved leave to the HRIS and team calendar.",
    highlightServices: ["Step Functions", "Lambda", "DynamoDB", "API Gateway"],
    diagramImage: "/images/architecture/leave-approval-system-archi.png",
    diagramAlt: "AWS leave approval system architecture — balance check, routing, and calendar sync",
    diagramWidth: 2528,
    diagramHeight: 1686,
    layers: [
      {
        id: "portal",
        name: "Employee Portal",
        services: [
          { name: "API Gateway", description: "Leave request and balance inquiry APIs" },
          { name: "Cognito", description: "Employee authentication" },
        ],
      },
      {
        id: "validation",
        name: "Validation",
        services: [
          { name: "Lambda", description: "Balance check, overlap detection, and team coverage rules" },
          { name: "DynamoDB", description: "Leave balances and request state" },
        ],
      },
      {
        id: "approval",
        name: "Approval",
        services: [
          { name: "Step Functions", description: "Manager approval with delegate and escalation" },
          { name: "SNS", description: "Notification to manager and employee" },
        ],
      },
      {
        id: "integration",
        name: "Integration",
        services: [
          { name: "Lambda", description: "HRIS balance sync and calendar update" },
          { name: "EventBridge", description: "Approved leave events to downstream systems" },
        ],
      },
      {
        id: "audit",
        name: "Audit",
        services: [
          { name: "S3", description: "Leave history and approval audit trail" },
          { name: "CloudWatch", description: "SLA and utilisation metrics" },
        ],
      },
    ],
    dataFlow: [
      { step: 1, label: "Leave request", detail: "Employee submits dates and type via portal; request stored in DynamoDB." },
      { step: 2, label: "Balance & coverage", detail: "Lambda checks available balance and team overlap rules." },
      { step: 3, label: "Manager approval", detail: "Step Functions routes to manager; SNS sends notification." },
      { step: 4, label: "HRIS sync", detail: "Approved leave deducts balance and syncs to HRIS via EventBridge." },
      { step: 5, label: "Calendar update", detail: "Team calendar updated; audit record archived to S3." },
    ],
    decisions: [
      { title: "Balance validation first", body: "Rejecting invalid requests before manager review reduces approver workload." },
      { title: "Delegate and escalation", body: "Step Functions supports manager delegate and auto-escalation when approver is on leave." },
      { title: "Event-driven HRIS sync", body: "EventBridge publishes approved leave so payroll and calendar systems update in near real-time." },
    ],
  },
  {
    id: "purchase-order-automation",
    title: "Purchase Order Automation",
    subtitle: "Requisition to PO with vendor and budget checks",
    cloud: "AWS",
    cloudColor: "orange",
    summary:
      "Automated purchase requisition workflow with budget validation and vendor selection.",
    overview:
      "A purchase order automation platform that converts employee requisitions into POs, validates budget availability, routes through approval chains, selects preferred vendors, and transmits POs to suppliers electronically.",
    highlightServices: ["Step Functions", "Lambda", "DynamoDB", "SNS"],
    diagramImage: "/images/architecture/purchase-order-automation-archi.png",
    diagramAlt: "AWS purchase order automation architecture — requisition, approval, and vendor transmission",
    diagramWidth: 2528,
    diagramHeight: 1686,
    layers: [
      {
        id: "requisition",
        name: "Requisition",
        services: [
          { name: "API Gateway", description: "Employee requisition submission portal" },
          { name: "DynamoDB", description: "Requisition and catalog data" },
        ],
      },
      {
        id: "validation",
        name: "Validation",
        services: [
          { name: "Lambda", description: "Budget check, vendor preference, and policy rules" },
          { name: "RDS Aurora", description: "Budget and vendor master data" },
        ],
      },
      {
        id: "approval",
        name: "Approval",
        services: [
          { name: "Step Functions", description: "Multi-level approval based on amount and category" },
          { name: "SNS", description: "Approver notifications" },
        ],
      },
      {
        id: "po-generation",
        name: "PO Generation",
        services: [
          { name: "Lambda", description: "PO document generation and vendor transmission" },
          { name: "S3", description: "PO PDF archive" },
        ],
      },
      {
        id: "tracking",
        name: "Tracking",
        services: [
          { name: "DynamoDB", description: "PO status and goods receipt matching" },
          { name: "EventBridge", description: "Status events to ERP and finance" },
        ],
      },
    ],
    dataFlow: [
      { step: 1, label: "Requisition submit", detail: "Employee selects items from catalog; requisition saved to DynamoDB." },
      { step: 2, label: "Budget validation", detail: "Lambda checks department budget and vendor compliance rules." },
      { step: 3, label: "Approval chain", detail: "Step Functions routes through approvers based on amount thresholds." },
      { step: 4, label: "PO generation", detail: "Approved requisition converted to PO; PDF sent to vendor electronically." },
      { step: 5, label: "Status tracking", detail: "PO status updates flow to ERP via EventBridge; receipt matching enabled." },
    ],
    decisions: [
      { title: "Threshold-based routing", body: "Approval chains vary by PO amount and category without hardcoding per department." },
      { title: "Vendor preference rules", body: "Lambda enforces preferred vendor and contract pricing before PO issuance." },
      { title: "ERP integration via events", body: "EventBridge decouples PO system from ERP for reliable async status sync." },
    ],
  },
  {
    id: "software-license-management",
    title: "Software License Management",
    subtitle: "Licence inventory, usage tracking, and optimisation",
    cloud: "AWS",
    cloudColor: "orange",
    summary:
      "Track software licences, monitor usage, and identify reclaim opportunities to reduce spend.",
    overview:
      "A software licence management platform that maintains a central licence registry, ingests usage data from SaaS and on-prem tools, identifies underutilised licences for reclaim, and alerts before renewal deadlines.",
    highlightServices: ["DynamoDB", "Lambda", "EventBridge", "QuickSight"],
    diagramImage: "/images/architecture/software-license-management-archi.png",
    diagramAlt: "AWS software license management architecture — inventory, usage tracking, and optimisation",
    diagramWidth: 2528,
    diagramHeight: 1686,
    layers: [
      {
        id: "registry",
        name: "Licence Registry",
        services: [
          { name: "DynamoDB", description: "Licence inventory with assignment and expiry" },
          { name: "API Gateway", description: "Licence provisioning and reclaim APIs" },
        ],
      },
      {
        id: "ingestion",
        name: "Usage Ingestion",
        services: [
          { name: "Lambda", description: "Scheduled pulls from SaaS admin APIs and SSO logs" },
          { name: "S3", description: "Raw usage data landing zone" },
        ],
      },
      {
        id: "analysis",
        name: "Analysis",
        services: [
          { name: "Lambda", description: "Utilisation scoring and reclaim recommendations" },
          { name: "Athena", description: "Usage trend queries over S3 data" },
        ],
      },
      {
        id: "alerts",
        name: "Alerts",
        services: [
          { name: "EventBridge", description: "Renewal deadline and overage events" },
          { name: "SNS", description: "Alerts to IT and procurement teams" },
        ],
      },
      {
        id: "reporting",
        name: "Reporting",
        services: [
          { name: "QuickSight", description: "Spend, utilisation, and compliance dashboards" },
          { name: "CloudWatch", description: "Ingestion pipeline monitoring" },
        ],
      },
    ],
    dataFlow: [
      { step: 1, label: "Licence register", detail: "New licences added to DynamoDB with seat count, cost, and renewal date." },
      { step: 2, label: "Usage collection", detail: "Lambda pulls login and usage data from SaaS APIs; raw data lands in S3." },
      { step: 3, label: "Utilisation analysis", detail: "Lambda scores usage per seat; inactive licences flagged for reclaim." },
      { step: 4, label: "Renewal alerts", detail: "EventBridge triggers SNS alerts 90/60/30 days before renewal." },
      { step: 5, label: "Optimisation report", detail: "QuickSight shows spend trends, reclaim opportunities, and compliance gaps." },
    ],
    decisions: [
      { title: "Usage-based reclaim", body: "Inactive seat detection from SSO and SaaS logs drives licence reclamation before renewal." },
      { title: "Proactive renewal alerts", body: "EventBridge schedules prevent surprise auto-renewals and support negotiation lead time." },
      { title: "Centralised registry", body: "DynamoDB single inventory eliminates shadow IT licence tracking in spreadsheets." },
    ],
  },
];

export function getArchitectureById(id: string): Architecture | undefined {
  return architectures.find((a) => a.id === id);
}
