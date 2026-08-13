#!/usr/bin/env node
/**
 * Unit tests for knowledge folder scanning and Gemini File Search sync.
 */

import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

type TestResult = { name: string; passed: boolean; detail?: string };

function assert(name: string, condition: boolean, detail?: string): TestResult {
  return { name, passed: condition, detail };
}

async function withTempKnowledge() {
  const knowledgeRoot = await mkdtemp(path.join(os.tmpdir(), "adritash-knowledge-"));
  const manifestPath = path.join(knowledgeRoot, ".manifest.json");
  return { knowledgeRoot, manifestPath };
}

function mockClient(options?: { failOn?: string }) {
  const uploads: string[] = [];
  const deletes: string[] = [];
  let seq = 0;

  return {
    uploads,
    deletes,
    client: {
      upload: async ({ filePath }: { filePath: string }) => {
        if (options?.failOn && filePath.endsWith(options.failOn)) {
          throw new Error("Simulated upload failure");
        }
        uploads.push(filePath);
        seq += 1;
        return { documentName: `fileSearchStores/test/documents/doc-${seq}` };
      },
      deleteDocument: async (documentName: string) => {
        deletes.push(documentName);
      },
    },
  };
}

async function runTests(): Promise<TestResult[]> {
  const { syncKnowledgeDocuments, readManifest } = await import(
    "../src/lib/ai/knowledge/knowledge-ingest"
  );
  const { formatMissingKnowledgeEnvError, getMissingKnowledgeEnv } = await import(
    "../src/lib/ai/knowledge/knowledge-env"
  );
  const { shouldUseFileSearchForMessage } = await import(
    "../src/lib/ai/knowledge/query-routing"
  );
  const { extractSourcesFromInteraction } = await import(
    "../src/lib/ai/knowledge/sources"
  );

  const results: TestResult[] = [];
  const { knowledgeRoot, manifestPath } = await withTempKnowledge();
  const paths = { knowledgeRoot, manifestPath };

  const first = mockClient();
  await writeFile(path.join(knowledgeRoot, "architecture.md"), "# Architecture\nUses Next.js.\n");

  const added = await syncKnowledgeDocuments({
    storeName: "fileSearchStores/test",
    paths,
    client: first.client,
  });

  results.push(
    assert(
      "New file is detected",
      added.added.includes("architecture.md") && first.uploads.length === 1,
      added.added.join(",")
    )
  );

  const second = mockClient();
  const unchanged = await syncKnowledgeDocuments({
    storeName: "fileSearchStores/test",
    paths,
    client: second.client,
  });

  results.push(
    assert(
      "Unchanged file is skipped",
      unchanged.unchanged.includes("architecture.md") && second.uploads.length === 0
    )
  );

  results.push(
    assert(
      "Duplicate sync does not create duplicate ingestion",
      unchanged.added.length === 0 &&
        unchanged.updated.length === 0 &&
        second.uploads.length === 0
    )
  );

  await writeFile(
    path.join(knowledgeRoot, "architecture.md"),
    "# Architecture\nUses Next.js and Gemini File Search.\n"
  );

  const third = mockClient();
  const updated = await syncKnowledgeDocuments({
    storeName: "fileSearchStores/test",
    paths,
    client: third.client,
  });

  results.push(
    assert(
      "Modified file is detected",
      updated.updated.includes("architecture.md") && third.uploads.length === 1,
      updated.updated.join(",")
    )
  );

  await writeFile(path.join(knowledgeRoot, "notes.bin"), "not supported");
  const fourth = mockClient();
  const unsupported = await syncKnowledgeDocuments({
    storeName: "fileSearchStores/test",
    paths,
    client: fourth.client,
  });

  results.push(
    assert(
      "Unsupported file is reported",
      unsupported.unsupported.some((item) => item.relativePath === "notes.bin")
    )
  );

  const previousKey = process.env.GEMINI_API_KEY;
  const previousStore = process.env.GEMINI_FILE_SEARCH_STORE;
  delete process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_FILE_SEARCH_STORE;
  const missing = getMissingKnowledgeEnv();
  const missingMessage = formatMissingKnowledgeEnvError(missing);
  if (previousKey) process.env.GEMINI_API_KEY = previousKey;
  if (previousStore) process.env.GEMINI_FILE_SEARCH_STORE = previousStore;

  results.push(
    assert(
      "Missing Gemini configuration is reported clearly",
      missing.includes("GEMINI_API_KEY") &&
        missing.includes("GEMINI_FILE_SEARCH_STORE") &&
        missingMessage.includes("GEMINI_API_KEY") &&
        missingMessage.includes(".env.local")
    )
  );

  const { knowledgeRoot: failRoot, manifestPath: failManifest } = await withTempKnowledge();
  await writeFile(path.join(failRoot, "keep.md"), "stable");
  await writeFile(path.join(failRoot, "broken.md"), "will fail");

  const okClient = mockClient();
  await syncKnowledgeDocuments({
    storeName: "fileSearchStores/test",
    paths: { knowledgeRoot: failRoot, manifestPath: failManifest },
    client: okClient.client,
  });

  const beforeFail = await readManifest(failManifest);
  await writeFile(path.join(failRoot, "broken.md"), "changed and will fail");
  const failing = mockClient({ failOn: "broken.md" });
  await syncKnowledgeDocuments({
    storeName: "fileSearchStores/test",
    paths: { knowledgeRoot: failRoot, manifestPath: failManifest },
    client: failing.client,
  });
  const afterFail = await readManifest(failManifest);

  results.push(
    assert(
      "Failed upload does not corrupt the manifest",
      afterFail?.files["keep.md"]?.contentHash ===
        beforeFail?.files["keep.md"]?.contentHash &&
        afterFail?.files["broken.md"]?.contentHash ===
          beforeFail?.files["broken.md"]?.contentHash &&
        afterFail?.files["broken.md"]?.documentName ===
          beforeFail?.files["broken.md"]?.documentName,
      JSON.stringify(afterFail?.files["broken.md"])
    )
  );

  const nestedDir = path.join(knowledgeRoot, "projects");
  await mkdir(nestedDir, { recursive: true });
  await writeFile(path.join(nestedDir, "risks.md"), "Risk: vendor lock-in.\n");
  const nested = mockClient();
  const nestedResult = await syncKnowledgeDocuments({
    storeName: "fileSearchStores/test",
    paths,
    client: nested.client,
  });

  results.push(
    assert(
      "Nested knowledge files are ingested",
      nestedResult.added.includes("projects/risks.md")
    )
  );

  const originalStore = process.env.GEMINI_FILE_SEARCH_STORE;
  process.env.GEMINI_FILE_SEARCH_STORE = "fileSearchStores/test";
  results.push(
    assert(
      "Arbitrary document questions use File Search",
      shouldUseFileSearchForMessage("What technologies are mentioned?") === true
    )
  );
  results.push(
    assert(
      "Greetings skip File Search on first turn",
      shouldUseFileSearchForMessage("Hello") === false
    )
  );
  if (originalStore) {
    process.env.GEMINI_FILE_SEARCH_STORE = originalStore;
  } else {
    delete process.env.GEMINI_FILE_SEARCH_STORE;
  }

  const unregisteredSource = extractSourcesFromInteraction({
    outputs: [
      {
        type: "text",
        annotations: [
          {
            type: "file_citation",
            file_name: "resume.pdf",
            custom_metadata: { title: "resume.pdf" },
          },
        ],
      },
    ],
  });

  results.push(
    assert(
      "Sources use Gemini citation metadata without fabricating titles",
      unregisteredSource.length === 1 && unregisteredSource[0]?.title === "resume.pdf"
    )
  );

  const emptySource = extractSourcesFromInteraction({
    outputs: [
      {
        type: "text",
        annotations: [{ type: "file_citation" }],
      },
    ],
  });

  results.push(
    assert("Missing citation metadata is not fabricated", emptySource.length === 0)
  );

  return results;
}

async function main() {
  const results = await runTests();
  let failed = 0;

  for (const result of results) {
    const status = result.passed ? "PASS" : "FAIL";
    console.log(`${status} - ${result.name}`);
    if (result.detail) console.log(`       ${result.detail}`);
    if (!result.passed) failed += 1;
  }

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
