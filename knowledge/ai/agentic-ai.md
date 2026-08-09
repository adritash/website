# Agentic AI

## Overview

Agentic AI refers to AI systems that can plan, use tools, and execute multi-step workflows autonomously or semi-autonomously — rather than producing a single static response.

## Business Problem

Many enterprise tasks require multiple steps: fetching data, validating results, calling APIs, and summarising outcomes. Simple chat completions cannot orchestrate these workflows reliably.

## Solution

Agentic architectures combine an LLM with tools (function calling), memory, and orchestration frameworks so the model can decide which tools to invoke and iterate until a task is complete.

## Architecture

Adritash reference and portfolio examples include:

- **Stock Market Agent** — scheduled GCP agent using Vertex AI and Gemini function calling to check market signals across multiple companies
- **Enterprise Knowledge Platform** — multi-agent workflows using LangGraph

Typical components:

- LLM with tool/function calling
- Tool implementations (APIs, databases, search)
- Orchestration layer (agent framework or workflow engine)
- Caching and rate-limit handling
- Audit logging of agent decisions

## Technology

- Google Gemini and Vertex AI (function calling, agent frameworks)
- LangGraph for multi-agent workflow orchestration
- Cloud Functions, Cloud Scheduler, Firestore (reference Stock Market Agent)
- MCP for standardised tool interfaces (see MCP knowledge document)

## Benefits

- Automates multi-step research and operational tasks
- Reduces manual effort for repetitive analysis workflows
- Maintains structured run history for audit and tuning

## Relevant Services

- AI Architecture
- Application Architecture

## Limitations / Assumptions

- Agentic systems require careful guardrails, human-in-the-loop review, and cost monitoring.
- Tool access must be scoped to prevent unintended actions.
- Reference architectures on Adritash.com are design patterns, not live products.
