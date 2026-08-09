/**
 * One-shot Gemini quota / File Search diagnostic.
 * Run once: npx tsx scripts/diagnose-quota.ts
 */
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv();

import { GoogleGenAI } from "@google/genai";
import { GEMINI_MODEL } from "../src/lib/ai/config";
import { ADRITASH_SYSTEM_PROMPT } from "../src/lib/ai/prompt";

function serializeError(error: unknown): Record<string, unknown> {
  if (!(error instanceof Error)) {
    return { raw: String(error) };
  }

  const record = error as Error & {
    status?: number;
    statusCode?: number;
    body?: unknown;
    error?: unknown;
    cause?: unknown;
    headers?: unknown;
  };

  return {
    name: record.name,
    message: record.message,
    status: record.status,
    statusCode: record.statusCode,
    body: record.body,
    error: record.error,
    cause: record.cause,
    headers: record.headers,
  };
}

function extractQuotaDetails(error: unknown): Record<string, unknown> | null {
  const serialized = serializeError(error);

  const candidates = [
    serialized.body,
    serialized.error,
    serialized.cause,
    (serialized.cause as { error?: unknown } | undefined)?.error,
    (serialized.body as { error?: unknown } | undefined)?.error,
  ];

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object") continue;

    const obj = candidate as Record<string, unknown>;
    const details = obj.details ?? (obj.error as Record<string, unknown> | undefined)?.details;

    if (Array.isArray(details)) {
      for (const detail of details) {
        if (
          detail &&
          typeof detail === "object" &&
          ("quotaMetric" in detail ||
            "@type" in detail ||
            "violations" in detail ||
            "retryDelay" in detail)
        ) {
          return detail as Record<string, unknown>;
        }
      }
    }

    if ("quotaMetric" in obj || "retryDelay" in obj) {
      return obj;
    }
  }

  return null;
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const storeName = process.env.GEMINI_FILE_SEARCH_STORE?.trim();

  console.log("=== Environment (booleans only) ===");
  console.log("GEMINI_API_KEY configured:", Boolean(apiKey));
  console.log("GEMINI_FILE_SEARCH_STORE configured:", Boolean(storeName));
  console.log("Model:", GEMINI_MODEL);

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const ai = new GoogleGenAI({ apiKey });

  console.log("\n=== 1. File Search store accessibility (read-only) ===");
  if (!storeName) {
    console.log("SKIP: GEMINI_FILE_SEARCH_STORE not set");
  } else {
    try {
      const store = await ai.fileSearchStores.get({ name: storeName });
      console.log("HTTP: 200 (store get succeeded)");
      console.log(
        JSON.stringify(
          {
            name: store.name,
            displayName: store.displayName,
            activeDocumentsCount: store.activeDocumentsCount,
            pendingDocumentsCount: store.pendingDocumentsCount,
            failedDocumentsCount: store.failedDocumentsCount,
          },
          null,
          2
        )
      );

      const documents: Array<{
        name?: string;
        displayName?: string;
        state?: string;
      }> = [];

      for await (const document of ai.fileSearchStores.documents.list({
        parent: storeName,
        config: { pageSize: 20 },
      })) {
        documents.push({
          name: document.name,
          displayName: document.displayName,
          state: document.state,
        });
        if (documents.length >= 5) break;
      }

      console.log("Sample indexed documents:", JSON.stringify(documents, null, 2));
    } catch (error) {
      console.log("HTTP: failed (store get)");
      console.log(JSON.stringify(serializeError(error), null, 2));
      console.log("Quota details:", JSON.stringify(extractQuotaDetails(error), null, 2));
    }
  }

  console.log("\n=== 2. Non-streaming WITHOUT File Search (single request) ===");
  try {
    const interaction = await ai.interactions.create({
      model: GEMINI_MODEL,
      input: "Reply with exactly: OK",
      system_instruction: ADRITASH_SYSTEM_PROMPT,
      stream: false,
    });

    console.log("HTTP: 200 (interaction create succeeded)");
    console.log(
      JSON.stringify(
        {
          id: interaction.id,
          outputPreview: interaction.output_text?.slice(0, 120),
        },
        null,
        2
      )
    );
  } catch (error) {
    const serialized = serializeError(error);
    console.log("HTTP:", serialized.status ?? serialized.statusCode ?? "unknown");
    console.log("Full error object:");
    console.log(JSON.stringify(serialized, null, 2));
    console.log("Extracted quota details:");
    console.log(JSON.stringify(extractQuotaDetails(error), null, 2));
  }

  console.log("\n=== 3. Non-streaming WITH File Search (single request) ===");
  if (!storeName) {
    console.log("SKIP: GEMINI_FILE_SEARCH_STORE not set");
    return;
  }

  try {
    const interaction = await ai.interactions.create({
      model: GEMINI_MODEL,
      input: "Reply with exactly: OK",
      system_instruction: ADRITASH_SYSTEM_PROMPT,
      stream: false,
      tools: [
        {
          type: "file_search",
          file_search_store_names: [storeName],
          metadata_filter: 'status="published" AND visibility="public"',
          top_k: 8,
        },
      ],
    });

    console.log("HTTP: 200 (interaction create with file search succeeded)");
    console.log(
      JSON.stringify(
        {
          id: interaction.id,
          outputPreview: interaction.output_text?.slice(0, 120),
        },
        null,
        2
      )
    );
  } catch (error) {
    const serialized = serializeError(error);
    console.log("HTTP:", serialized.status ?? serialized.statusCode ?? "unknown");
    console.log("Full error object:");
    console.log(JSON.stringify(serialized, null, 2));
    console.log("Extracted quota details:");
    console.log(JSON.stringify(extractQuotaDetails(error), null, 2));
  }
}

main().catch((error) => {
  console.error("Diagnostic script failed:", error);
  process.exit(1);
});
