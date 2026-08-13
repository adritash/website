# Adritash AI Knowledge Base

Canonical RAG documentation: **[docs/RAG.md](./RAG.md)**.

Phase 2 still uses Gemini File Search only. Developers add files under `knowledge/` and run `npm run knowledge:sync`. Production chat on Vercel reads `GEMINI_FILE_SEARCH_STORE`; it does not persist the knowledge folder on the serverless filesystem.
