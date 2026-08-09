# Model Context Protocol (MCP)

## Overview

The Model Context Protocol (MCP) is an open standard for connecting AI models to external tools, data sources, and services through a consistent interface.

## Business Problem

Enterprises integrate AI with many systems (databases, APIs, documentation, calendars). Without a standard protocol, each integration requires custom tool wiring per model and per application.

## Solution

MCP provides a standard way for AI applications to discover and invoke tools and resources, improving interoperability between models and enterprise systems.

## Architecture

In Adritash portfolio work, MCP appears as part of enterprise AI platform design:

- **AI-Powered Enterprise Knowledge & Automation Platform** — multi-agent workflows using LangGraph and MCP

Typical MCP integration pattern:

1. MCP server exposes tools and resources
2. AI client (agent or assistant) connects to MCP servers
3. Model selects and invokes MCP tools during conversation or workflow execution

## Technology

- MCP servers and clients
- LangGraph for agent orchestration alongside MCP tools
- LLMs with tool-calling support (e.g., Gemini)

## Benefits

- Standardised tool integration across AI applications
- Easier addition of new data sources without rewriting agent logic
- Better separation between model logic and enterprise integrations

## Relevant Services

- AI Architecture
- Enterprise integration consulting

## Limitations / Assumptions

- MCP is an evolving standard; specific server implementations vary by use case.
- Adritash.com Phase 2 public chatbot does not expose MCP to visitors (planned for a future phase).
- Security and access control for MCP tools must be designed per deployment.
