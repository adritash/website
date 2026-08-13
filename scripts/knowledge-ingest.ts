#!/usr/bin/env node
/**
 * Developer CLI for Adritash knowledge base ingestion.
 *
 * Usage:
 *   npm run knowledge:create-store
 *   npm run knowledge:sync
 *   npm run knowledge:list
 *   npm run knowledge:status
 *   npm run knowledge:clear -- --confirm
 */

import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv();

async function main() {
  const command = process.argv[2] ?? "help";

  const {
    clearKnowledgeStore,
    createAndReportFileSearchStore,
    formatKnowledgeSyncSummary,
    listKnowledgeFiles,
    reportKnowledgeStoreStatus,
    syncKnowledgeDocuments,
  } = await import("../src/lib/ai/knowledge/knowledge-ingest");
  const {
    formatMissingKnowledgeEnvError,
    getMissingKnowledgeEnv,
  } = await import("../src/lib/ai/knowledge/knowledge-env");

  const storeName = process.env.GEMINI_FILE_SEARCH_STORE?.trim();

  if (command === "create-store") {
    const missingKey = process.env.GEMINI_API_KEY?.trim()
      ? []
      : ["GEMINI_API_KEY"];
    if (missingKey.length) {
      throw new Error(formatMissingKnowledgeEnvError(missingKey));
    }

    const displayName = process.argv[3] ?? "adritash-knowledge";
    const store = await createAndReportFileSearchStore(displayName);
    console.log("Created File Search store:");
    console.log(`  name: ${store.name}`);
    console.log(`  displayName: ${store.displayName ?? displayName}`);
    console.log("\nAdd to .env.local:");
    console.log(`GEMINI_FILE_SEARCH_STORE=${store.name}`);
    return;
  }

  if (command === "list") {
    const listing = await listKnowledgeFiles();
    console.log(`Knowledge files (${listing.files.length}):`);
    for (const file of listing.files) {
      console.log(
        `  - ${file.relativePath} [${file.status}] ${file.displayName}`
      );
    }
    if (listing.unsupported.length) {
      console.log("Unsupported:");
      for (const item of listing.unsupported) {
        console.log(`  - ${item.relativePath}: ${item.reason}`);
      }
    }
    return;
  }

  if (command === "status") {
    const missing = getMissingKnowledgeEnv();
    if (missing.length) {
      throw new Error(formatMissingKnowledgeEnvError(missing));
    }

    const status = await reportKnowledgeStoreStatus(storeName!);
    console.log(`Store: ${status.store.name}`);
    console.log(`Active documents: ${status.store.activeDocumentsCount ?? "unknown"}`);
    console.log(`Manifest: ${status.manifestPath}`);
    console.log(`Indexed in store (${status.documents.length}):`);
    for (const doc of status.documents) {
      console.log(`  - ${doc.displayName ?? doc.name} [${doc.state ?? "unknown"}]`);
    }

    if (status.manifest?.files) {
      console.log(`Manifest entries (${Object.keys(status.manifest.files).length}):`);
      for (const [relativePath, entry] of Object.entries(status.manifest.files)) {
        console.log(`  - ${relativePath} -> ${entry.documentName ?? entry.status}`);
      }
    }
    return;
  }

  if (command === "sync" || command === "ingest") {
    const missing = getMissingKnowledgeEnv();
    if (missing.length) {
      throw new Error(formatMissingKnowledgeEnvError(missing));
    }

    const force = process.argv.includes("--force");
    console.log(`Syncing knowledge into ${storeName}...`);
    const result = await syncKnowledgeDocuments({ storeName: storeName!, force });
    console.log(formatKnowledgeSyncSummary(result));

    if (result.failed.length) {
      process.exitCode = 1;
    }

    return;
  }

  if (command === "clear") {
    const confirm = process.argv.includes("--confirm");
    if (!confirm) {
      console.error(
        "Refusing to clear the File Search Store.\nRe-run with: npm run knowledge:clear -- --confirm"
      );
      process.exitCode = 1;
      return;
    }

    const missing = getMissingKnowledgeEnv();
    if (missing.length) {
      throw new Error(formatMissingKnowledgeEnvError(missing));
    }

    const outcome = await clearKnowledgeStore({
      storeName: storeName!,
      confirm: true,
    });
    console.log(`Deleted: ${outcome.deleted.length}`);
    if (outcome.failed.length) {
      console.error("Failures:");
      for (const failure of outcome.failed) {
        console.error(`  - ${failure.path}: ${failure.message}`);
      }
      process.exitCode = 1;
    }
    return;
  }

  console.log(`Adritash knowledge CLI

Commands:
  create-store [displayName]   Create a Gemini File Search store
  sync [--force]               Scan knowledge/ and index new/changed files
  ingest [--force]             Alias for sync
  list                         List files in knowledge/ and manifest status
  status                       Show Gemini store and local manifest status
  clear --confirm              Delete indexed documents recorded in the manifest
`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  if (message.toLowerCase().includes("api key") || message.includes("GEMINI_API_KEY")) {
    console.error(message.replace(/AIza[0-9A-Za-z_-]+/g, "[redacted]"));
  } else {
    console.error(message);
  }
  process.exit(1);
});
