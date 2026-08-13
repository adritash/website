# Adritash AI RAG

This document describes the current retrieval-augmented generation (RAG) implementation. It does not introduce additional vector databases, MCP, or multi-agent systems.

## 1. Architecture

Three layers stay separate:

| Layer | Role | Location |
|-------|------|----------|
| Knowledge source | Files you manage | `website/knowledge/` |
| Retrieval / index | Gemini File Search Store | Google Gemini API |
| Query / AI | Chat API + UI | `/api/ai/chat`, Adritash AI widget |

```
                 KNOWLEDGE SOURCES
                       │
                       ▼
                 knowledge/
                       │
                       ▼
               knowledge:sync
                       │
                       ▼
            Gemini File Search Store
                       │
                Semantic Retrieval
                       │
                       ▼
                  /api/ai/chat
                       │
                       ▼
                    Gemini
                       │
                       ▼
               Grounded Response
                       │
                       ▼
                 Adritash AI UI
```

The chatbot is unchanged as a public streaming chat. When `GEMINI_FILE_SEARCH_STORE` is set, Gemini attaches the File Search tool and retrieves chunks from the store.

## 2. Knowledge folder

`website/knowledge/` is the source of truth. Drop supported files there; they do not need a hardcoded question list or a required registry entry.

Optional metadata (display title, category, public URL) can be added in `src/lib/ai/knowledge/knowledge-config.ts`. Unlisted files are still scanned and indexed.

Developer documentation in `knowledge/README.md` is **not** indexed.

## 3. Ingestion process

From `website/`:

```bash
npm run knowledge:sync
```

The CLI:

1. Checks `GEMINI_API_KEY` and `GEMINI_FILE_SEARCH_STORE` (never `NEXT_PUBLIC_*`)
2. Scans `knowledge/` for supported files
3. Hashes file bytes
4. Uploads new files
5. Re-indexes changed files (upload new version, then delete the previous store document)
6. Removes store documents for files deleted from disk
7. Skips unchanged hashes
8. Reports unsupported files and failures

Example summary:

```
Knowledge Sync
-------------------------
Added:     5
Updated:   2
Unchanged: 8
Removed:   0
Failed:    0
```

Local state: `knowledge/.manifest.json` (path, hash, size, mtime, MIME type, Gemini document name, status). The process is idempotent.

Failed uploads keep the previous successful manifest entry so a bad run does not mark a file as indexed with a new hash.

## 4. Gemini File Search Store

Configured only via:

```
GEMINI_FILE_SEARCH_STORE=fileSearchStores/...
```

Create a store once:

```bash
npm run knowledge:create-store
```

Chat requests use `tools: [{ type: "file_search", file_search_store_names: [...] }]` with metadata filter `status="published" AND visibility="public"`. Sync writes that metadata on every upload.

Do not hard-code the store ID in source.

## 5. Retrieval flow

1. Visitor sends a message from the existing chat UI.
2. `POST /api/ai/chat` validates input, rate-limits, and never returns the API key.
3. For non-greeting questions, the server enables File Search when the store env var is set.
4. Gemini retrieves relevant chunks from the store and generates an answer.
5. If File Search fails (except quota/rate-limit), the API falls back to prompt-only so chat still works.
6. Citations from Gemini (when present) are mapped to source titles for the UI.

Questions are free-form. There is no FAQ map.

## 6. Source attribution

The UI shows a **Sources** list only when Gemini File Search returns citation metadata (`file_name`, `title`, or `source_path`). Titles come from:

1. Optional registry overlay
2. Citation `title` metadata
3. `file_name` / `source_path` from Gemini

If Gemini does not return citation data, the UI does not invent filenames.

## 7. Local development

```bash
cd website
cp .env.example .env.local
# set GEMINI_API_KEY and GEMINI_FILE_SEARCH_STORE
npm run knowledge:sync
npm run dev
```

`.env.local` is gitignored. Keys stay server-side / CLI-side.

Useful commands:

| Command | Purpose |
|---------|---------|
| `npm run knowledge:sync` | Index new/changed files |
| `npm run knowledge:list` | Show disk files vs manifest |
| `npm run knowledge:status` | Show store + manifest |
| `npm run knowledge:clear -- --confirm` | Delete indexed docs in the manifest |
| `npm test` | Ingest unit tests + chat validation |
| `npm run test:ai:live` | Live Gemini RAG checks |

## 8. Production deployment

Vercel hosts the website. **The serverless filesystem is not a persistent knowledge store.**

- Commit (or otherwise manage) files under `knowledge/` in git if you want them versioned.
- Run `npm run knowledge:sync` on a laptop or in CI. That writes to Gemini File Search, not to Vercel disk.
- Set `GEMINI_API_KEY` and `GEMINI_FILE_SEARCH_STORE` in Vercel project environment variables (server-only).
- Redeploy after changing env vars.
- Production chat **reads** the store. It does not ingest files at request time.

Do not implement knowledge upload through the public site in this phase.

## 9. Troubleshooting

| Symptom | What to check |
|---------|----------------|
| Chat works but ignores new files | Did you run `knowledge:sync`? Wait for indexing (`knowledge:status`). |
| Generic answers | `GEMINI_FILE_SEARCH_STORE` set in local env **and** Vercel? |
| Sync fails with missing config | `.env.local` has `GEMINI_API_KEY` and `GEMINI_FILE_SEARCH_STORE` |
| Duplicate documents | Sync deletes the previous document after a successful re-upload (`force: true` so chunks are removed); inspect `knowledge:status` |
| Unsupported file listed | Extension is not in the File Search support map |
| Sources missing | Gemini omitted citations; do not fake them |
| Production chat 503 | Vercel env vars missing; check function logs for `[ai/chat]` |

## 10. Security considerations

- API keys are never sent to the browser. Do not use `NEXT_PUBLIC_GEMINI_*`.
- CLI errors redact `AIza…` key-shaped strings.
- `/api/ai/chat` cannot upload or delete knowledge.
- Sync refuses path traversal and skips symbolic links.
- Document bodies are treated as **untrusted data**. System instructions tell the model to ignore document text that tries to override instructions or reveal secrets.
- Only put documents in `knowledge/` that you are willing to expose through the public chatbot.
- `knowledge:clear` requires `--confirm`.

## Tests

```bash
npm run test:knowledge   # scan/sync unit tests (no Gemini)
npm run test:ai          # request validation + routing
npm run test:ai:live     # live grounded questions (uses quota)
```
