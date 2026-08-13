# Knowledge folder

This folder is the **source of truth** for documents Adritash AI can retrieve.

Gemini File Search Store is the managed index. The website only **queries** that store. It does not write files on Vercel.

## What belongs here

Approved documents you want the public chatbot to use:

- Company and service overviews
- Architecture notes
- Project documents
- Resumes or capability statements you intend to be public
- Markdown, PDF, DOCX, CSV, JSON, and source/text files Gemini File Search can index

Do **not** put secrets, API keys, private client data, or internal-only material unless you accept that the public chatbot can retrieve it.

## Supported formats

Gemini File Search indexes these (no custom parsing in this repo):

- PDF (`.pdf`)
- Markdown (`.md`, `.markdown`)
- Plain text (`.txt`)
- Word (`.docx`)
- CSV / JSON
- Common source/text files (`.ts`, `.js`, `.py`, `.html`, `.yaml`, and similar)

Skipped automatically:

- Hidden files and folders (names starting with `.`)
- `README.md` / `README.txt` (developer docs, not indexed)
- `.gitkeep`, `.manifest.json`
- Symbolic links
- Files larger than 100 MB
- Unknown extensions (reported as unsupported)

## Naming conventions

- Use lowercase kebab-case names: `cloud-migration.md`
- Put files in topic folders (`about/`, `services/`, `architecture/`, …)
- Prefer a clear title in the first heading of markdown files
- Avoid `..` and unusual control characters in file names

Optional display titles and public URLs can still be registered in `src/lib/ai/knowledge/knowledge-config.ts`. Unregistered files are still ingested.

## Add a document

1. Copy the file into `website/knowledge/` (any subfolder).
2. From `website/`, run `npm run knowledge:sync`.
3. Check the summary (`Added` should include the file).
4. Optionally run `npm run knowledge:status`.

## Update a document

1. Edit the file in place.
2. Run `npm run knowledge:sync`.
3. Changed files appear under `Updated`. Unchanged files are skipped.

## Remove a document

1. Delete the file from `knowledge/`.
2. Run `npm run knowledge:sync`.
3. The script removes the corresponding File Search document using the local manifest.

## Synchronization

```bash
cd website
npm run knowledge:sync
```

Other commands:

```bash
npm run knowledge:list
npm run knowledge:status
npm run knowledge:clear -- --confirm   # destructive; requires the flag
```

The local manifest is `knowledge/.manifest.json` (gitignored). It stores hashes so a second sync without changes does not re-upload.

## How RAG works

```
knowledge/  →  npm run knowledge:sync  →  Gemini File Search Store
                                              ↓
                                   POST /api/ai/chat (read-only)
                                              ↓
                                         Adritash AI UI
```

Ingestion is CLI-only. Production chat on Vercel reads the configured `GEMINI_FILE_SEARCH_STORE`. Do not expect the Vercel serverless filesystem to persist this folder.

See `docs/RAG.md` for architecture, environment variables, and troubleshooting.
