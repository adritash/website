# Stock Market Agent Architecture

## Overview

Reference architecture for a scheduled AI agent that monitors market signals for 10 companies and delivers a consolidated report. Published on Adritash.com as a GCP reference design.

## Business Problem

Portfolio or research teams need periodic market summaries across multiple companies without manually checking prices, volume, and news for each ticker.

## Solution

A lightweight AI agent that runs on a schedule, uses Vertex AI with Gemini function calling to orchestrate market data checks, caches results to respect API rate limits, stores run history, and optionally delivers reports by email.

## Architecture

### Trigger

- Cloud Scheduler — cron-based daily or weekly job trigger

### Agent Orchestration

- Vertex AI Agent Builder — agent framework with tool-use and reasoning
- Gemini — LLM with function calling for structured market analysis

### Tools

- Cloud Functions — market data fetch (price, volume, news sentiment)
- Secret Manager — API keys for market data providers

### Cache

- Memorystore Redis — cache market data to respect API rate limits

### Output

- Firestore — run history and agent decision log
- Cloud Storage — report artifacts
- SendGrid / Gmail API — optional email delivery

## Technology

**Primary stack:** GCP, Cloud Scheduler, Vertex AI, Gemini, Cloud Functions, Secret Manager, Memorystore Redis, Firestore, Cloud Storage

## Benefits

- Automated multi-company monitoring on a schedule
- Cached data reduces external API usage
- Auditable run history in Firestore

## Relevant Services

- AI Architecture
- Agentic AI patterns

## Limitations / Assumptions

- Monitors 10 companies in the reference design; count is configurable.
- Reference architecture only — not a live Adritash product offering.
- Market data provider APIs require separate licensing and keys.
