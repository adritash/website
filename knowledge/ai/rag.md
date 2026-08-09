# Retrieval-Augmented Generation (RAG)

## Overview

Retrieval-Augmented Generation (RAG) is an AI pattern that retrieves relevant documents or data chunks before generating a model response, grounding answers in authoritative sources rather than relying solely on the model's training data.

## Business Problem

Large language models can answer general questions but may hallucinate organisation-specific facts. Enterprises need assistants that cite internal documentation, architecture standards, and approved knowledge.

## Solution

A RAG pipeline typically:

1. Ingests and chunks approved documents
2. Embeds chunks into a searchable index
3. Retrieves relevant chunks for a user query
4. Passes retrieved context to the LLM with instructions to ground answers

## Architecture

Adritash applies RAG in multiple contexts:

- **Enterprise knowledge platforms** — semantic search over engineering documentation (see AI Architecture portfolio example)
- **Adritash.com AI assistant (Phase 2)** — Gemini File Search store with managed indexing and retrieval via the Interactions API

## Technology

- Embedding models (e.g., Gemini embedding models for File Search)
- Vector or managed retrieval stores (Gemini File Search, or client-specific vector databases)
- LLMs (e.g., Google Gemini) for grounded generation
- Orchestration frameworks (LangGraph for multi-step agent workflows)

## Benefits

- More accurate answers for domain-specific questions
- Reduced hallucination when sources are available
- Ability to update knowledge without retraining models

## Relevant Services

- AI Architecture consulting
- Application Architecture (for integrating RAG into enterprise systems)

## Limitations / Assumptions

- RAG quality depends on source document quality and retrieval relevance.
- RAG does not replace governance — only approved documents should be indexed.
- When no relevant source exists, the assistant should say so rather than invent facts.
