import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

import { GoogleGenAI } from "@google/genai";
import { ADRITASH_SYSTEM_PROMPT } from "../src/lib/ai/prompt";
import { GEMINI_MODEL } from "../src/lib/ai/config";

const apiKey = process.env.GEMINI_API_KEY?.trim();
const storeName = process.env.GEMINI_FILE_SEARCH_STORE?.trim();

console.log("GEMINI_API_KEY set:", Boolean(apiKey));
console.log("GEMINI_FILE_SEARCH_STORE set:", Boolean(storeName));

if (!apiKey) {
  throw new Error("Missing GEMINI_API_KEY");
}

const ai = new GoogleGenAI({ apiKey });

async function testBasic() {
  console.log("\n=== TEST: basic (no file search, no stream) ===");
  try {
    const interaction = await ai.interactions.create({
      model: GEMINI_MODEL,
      input: "Tell me about Adritash",
      system_instruction: ADRITASH_SYSTEM_PROMPT,
      stream: false,
    });
    console.log("OK id:", interaction.id);
    console.log("output_text:", interaction.output_text?.slice(0, 200));
  } catch (error) {
    console.error("FAIL:", error);
  }
}

async function testFileSearchNoStream() {
  if (!storeName) {
    console.log("\n=== SKIP file search non-stream (no store) ===");
    return;
  }
  console.log("\n=== TEST: file search, no stream ===");
  try {
    const interaction = await ai.interactions.create({
      model: GEMINI_MODEL,
      input: "Tell me about Adritash",
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
    console.log("OK id:", interaction.id);
    console.log("output_text:", interaction.output_text?.slice(0, 200));
  } catch (error) {
    console.error("FAIL:", error);
  }
}

async function testBasicStream() {
  console.log("\n=== TEST: basic stream (no file search) ===");
  try {
    const stream = await ai.interactions.create({
      model: GEMINI_MODEL,
      input: "Tell me about Adritash",
      system_instruction: ADRITASH_SYSTEM_PROMPT,
      stream: true,
    });

    for await (const event of stream) {
      console.log("event:", JSON.stringify(event).slice(0, 300));
    }
  } catch (error) {
    console.error("FAIL:", error);
  }
}

async function testFileSearchStream() {
  if (!storeName) {
    console.log("\n=== SKIP file search stream (no store) ===");
    return;
  }
  console.log("\n=== TEST: file search + stream ===");
  try {
    const stream = await ai.interactions.create({
      model: GEMINI_MODEL,
      input: "Tell me about Adritash",
      system_instruction: ADRITASH_SYSTEM_PROMPT,
      stream: true,
      tools: [
        {
          type: "file_search",
          file_search_store_names: [storeName],
          metadata_filter: 'status="published" AND visibility="public"',
          top_k: 8,
        },
      ],
    });

    for await (const event of stream) {
      console.log("event:", JSON.stringify(event).slice(0, 400));
    }
  } catch (error) {
    console.error("FAIL:", error);
  }
}

async function testStore() {
  if (!storeName) return;
  console.log("\n=== TEST: file search store get ===");
  try {
    const store = await ai.fileSearchStores.get({ name: storeName });
    console.log("store:", {
      name: store.name,
      activeDocumentsCount: store.activeDocumentsCount,
      pendingDocumentsCount: store.pendingDocumentsCount,
      failedDocumentsCount: store.failedDocumentsCount,
    });
  } catch (error) {
    console.error("FAIL store get:", error);
  }
}

async function main() {
  await testStore();
  await testBasic();
  await testFileSearchNoStream();
  await testBasicStream();
  await testFileSearchStream();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
