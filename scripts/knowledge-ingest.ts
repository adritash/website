#!/usr/bin/env node
/**
 * Developer CLI for Adritash knowledge base ingestion.
 *
 * Usage:
 *   npm run knowledge:create-store
 *   npm run knowledge:ingest
 *   npm run knowledge:status
 */

import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv();

async function main() {
  const command = process.argv[2] ?? "help";

  const {
    createAndReportFileSearchStore,
    ingestKnowledgeDocuments,
    reportKnowledgeStoreStatus,
    validateKnowledgeFilesOnDisk,
  } = await import("../src/lib/ai/knowledge/knowledge-ingest");

  const storeName = process.env.GEMINI_FILE_SEARCH_STORE?.trim();

  if (command === "create-store") {
    const displayName = process.argv[3] ?? "adritash-knowledge";
    const store = await createAndReportFileSearchStore(displayName);
    console.log("Created File Search store:");
    console.log(`  name: ${store.name}`);
    console.log(`  displayName: ${store.displayName ?? displayName}`);
    console.log("\nAdd to .env.local:");
    console.log(`GEMINI_FILE_SEARCH_STORE=${store.name}`);
    return;
  }

  if (command === "status") {
    if (!storeName) {
      throw new Error("GEMINI_FILE_SEARCH_STORE is not configured");
    }

    const diskErrors = await validateKnowledgeFilesOnDisk();
    if (diskErrors.length) {
      console.warn("Knowledge file issues:");
      for (const error of diskErrors) console.warn(`  - ${error}`);
    }

    const status = await reportKnowledgeStoreStatus(storeName);
    console.log(`Store: ${status.store.name}`);
    console.log(`Active documents: ${status.store.activeDocumentsCount ?? "unknown"}`);
    console.log(`Manifest: ${status.manifestPath}`);
    console.log(`Indexed in store (${status.documents.length}):`);
    for (const doc of status.documents) {
      console.log(`  - ${doc.displayName ?? doc.name} [${doc.state ?? "unknown"}]`);
    }

    if (status.manifest?.documents) {
      console.log(`Manifest entries (${Object.keys(status.manifest.documents).length}):`);
      for (const [id, entry] of Object.entries(status.manifest.documents)) {
        console.log(`  - ${id} -> ${entry.documentName}`);
      }
    }
    return;
  }

  if (command === "ingest") {
    if (!storeName) {
      throw new Error("GEMINI_FILE_SEARCH_STORE is not configured");
    }

    const force = process.argv.includes("--force");
    const diskErrors = await validateKnowledgeFilesOnDisk();
    if (diskErrors.length) {
      throw new Error(diskErrors.join("\n"));
    }

    console.log(`Ingesting knowledge into ${storeName}...`);
    const result = await ingestKnowledgeDocuments({ storeName, force });

    console.log(`Uploaded: ${result.uploaded.length}`);
    console.log(`Replaced: ${result.replaced.length}`);
    console.log(`Skipped: ${result.skipped.length}`);
    console.log(`Deleted (previous): ${result.deleted.length}`);

    if (result.errors.length) {
      console.error("Errors:");
      for (const error of result.errors) {
        console.error(`  - ${error.id}: ${error.message}`);
      }
      process.exitCode = 1;
    }

    return;
  }

  console.log(`Adritash knowledge CLI

Commands:
  create-store [displayName]   Create a Gemini File Search store
  ingest [--force]             Upload published knowledge documents
  status                       Show store and manifest status
`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
