# Adritash AI Knowledge Base (Phase 2 RAG)

This document describes the Adritash AI knowledge base, Gemini File Search integration, and developer workflows.

## Architecture

```
Visitor → Chat UI → POST /api/ai/chat → Gemini Interactions API
                                              ↓
                                    File Search tool (optional)
                                              ↓
                                   Adritash knowledge markdown
                                              ↓
                              Grounded streaming response + sources
```

Phase 1 chat behavior is preserved. When `GEMINI_FILE_SEARCH_STORE` is configured, the chat API attaches Gemini File Search as a tool. If retrieval fails, the API falls back to the Adritash system prompt only.

## Knowledge base structure

Knowledge files live in `website/knowledge/`:

| Directory | Purpose |
|-----------|---------|
| `about/` | Brand and company overview |
| `services/` | Consulting service areas |
| `architecture/` | Reference architecture designs |
| `ai/` | RAG, agentic AI, MCP concepts |
| `consulting/` | Consulting practice overview |
| `resources/` | Contact and public resources |

Document registry: `src/lib/ai/knowledge/knowledge-config.ts`

Only documents with `status: "published"` and `visibility: "public"` are ingested and queried by the public chatbot.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes (for AI chat) | Server-side Gemini API key |
| `GEMINI_FILE_SEARCH_STORE` | For RAG | File Search store resource name |
| `CONTACT_EMAIL` | No | Contact form recipient |
| `RESEND_API_KEY` | For contact form | Unchanged from Phase 1 |

Copy `.env.example` to `.env.local` and fill in values. Never commit `.env.local`.

## Create a File Search store

From `website/`:

```bash
npm run knowledge:create-store
```

This prints a store name like `fileSearchStores/...`. Add it to `.env.local`:

```bash
GEMINI_FILE_SEARCH_STORE=fileSearchStores/your-store-name
```

## Ingest knowledge

Ingestion is a developer/admin operation only. It does not run on deploy or via public APIs.

```bash
npm run knowledge:ingest
```

Options:

- Re-upload changed files only (default; uses content hash manifest)
- Force re-upload all files: `tsx scripts/knowledge-ingest.ts ingest --force`

Check indexing status:

```bash
npm run knowledge:status
```

Manifest file: `knowledge/.ingest-manifest.json` (local state mapping source IDs to indexed document names).

## Update knowledge

1. Edit or add markdown under `knowledge/`
2. Register new documents in `src/lib/ai/knowledge/knowledge-config.ts`
3. Run `npm run knowledge:ingest`
4. Verify with `npm run knowledge:status`
5. Test retrieval with `npm run test:ai:live`

## Test RAG

Unit validation tests (no API calls):

```bash
npm run test:ai
```

Live Gemini + File Search tests (requires API key and ingested store):

```bash
npm run test:ai:live
```

Recommended manual checks in the chat widget:

1. What is Adritash?
2. What services does Adritash provide?
3. Tell me about the Financial Reporting architecture.
4. What technology was used? (follow-up)
5. What was the business problem? (follow-up)
6. What is RAG?
7. What is MCP?
8. Who is Adritash's biggest client? (should refuse to invent)
9. What was Adritash's 2025 revenue? (should refuse to invent)

## Troubleshooting indexing

| Symptom | Check |
|---------|-------|
| Chat works but answers are generic | `GEMINI_FILE_SEARCH_STORE` set in `.env.local`? |
| Ingest fails auth | `GEMINI_API_KEY` valid? |
| Documents stuck pending | Run `npm run knowledge:status`; wait and retry ingest |
| Duplicate documents after edits | Ingest deletes prior document via manifest before re-upload |
| Metadata filter returns nothing | Ensure `status` and `visibility` metadata were uploaded |

Server logs use `[ai/chat]` prefix. File Search fallback messages are logged server-side only.

## Security

Public users cannot:

- Upload, modify, or delete knowledge
- Access store IDs or API keys
- Trigger ingestion

`/api/ai/chat` is read/query-only with respect to the knowledge base.

## Cost considerations

- File Search indexing incurs embedding cost when documents are uploaded
- Query-time retrieval uses Gemini model tokens (input/output) plus File Search retrieval
- Ingestion is explicit and hash-gated to avoid duplicate indexing
- Rate limiting remains 10 requests/minute/IP (Phase 1)

## Future admin UI

The ingestion modules are structured so a future `/admin/knowledge` UI can call the same `knowledge-ingest.ts` functions. No admin UI is implemented in Phase 2.
