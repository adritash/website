import {
  getKnowledgeDocumentByFileName,
  getKnowledgeDocumentById,
  getKnowledgeDocumentByRelativePath,
  type KnowledgeCategory,
} from "@/lib/ai/knowledge/knowledge-config";

export type ChatSource = {
  title: string;
  type?: KnowledgeCategory;
  url?: string;
};

type FileCitationAnnotation = {
  type?: string;
  file_name?: string;
  source?: string;
  document_uri?: string;
  custom_metadata?: Record<string, unknown>;
};

type TextContentBlock = {
  type?: string;
  text?: string;
  annotations?: FileCitationAnnotation[];
};

type InteractionStep = {
  type?: string;
  content?: TextContentBlock[];
};

type InteractionLike = {
  steps?: InteractionStep[];
  outputs?: Array<{ type?: string; text?: string; annotations?: FileCitationAnnotation[] }>;
};

function readMetadataString(
  metadata: Record<string, unknown> | undefined,
  key: string
): string | undefined {
  if (!metadata) return undefined;
  const value = metadata[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function resolveSourceFromCitation(
  annotation: FileCitationAnnotation
): ChatSource | null {
  if (annotation.type && annotation.type !== "file_citation") {
    return null;
  }

  const sourceId = readMetadataString(annotation.custom_metadata, "source_id");
  const sourcePath = readMetadataString(annotation.custom_metadata, "source_path");

  const configured =
    (sourceId ? getKnowledgeDocumentById(sourceId) : undefined) ??
    (sourcePath ? getKnowledgeDocumentByRelativePath(sourcePath) : undefined) ??
    (annotation.file_name
      ? getKnowledgeDocumentByFileName(annotation.file_name)
      : undefined);

  const title =
    configured?.title ||
    readMetadataString(annotation.custom_metadata, "title") ||
    annotation.file_name ||
    sourcePath ||
    annotation.source;

  if (!title) {
    return null;
  }

  const publicUrl =
    configured?.publicUrl ||
    readMetadataString(annotation.custom_metadata, "public_url");

  return {
    title,
    type: configured?.category,
    url: publicUrl,
  };
}

function mergeSources(sources: ChatSource[]): ChatSource[] {
  const seen = new Set<string>();
  const merged: ChatSource[] = [];

  for (const source of sources) {
    const key = `${source.title.toLowerCase()}|${source.url ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(source);
  }

  return merged;
}

export function extractSourcesFromInteraction(
  interaction: InteractionLike
): ChatSource[] {
  const sources: ChatSource[] = [];

  for (const step of interaction.steps ?? []) {
    if (step.type !== "model_output") continue;

    for (const block of step.content ?? []) {
      if (block.type !== "text") continue;

      for (const annotation of block.annotations ?? []) {
        const source = resolveSourceFromCitation(annotation);
        if (source) sources.push(source);
      }
    }
  }

  for (const output of interaction.outputs ?? []) {
    for (const annotation of output.annotations ?? []) {
      const source = resolveSourceFromCitation(annotation);
      if (source) sources.push(source);
    }
  }

  return mergeSources(sources);
}

export function extractSourcesFromStreamAnnotation(
  annotations: FileCitationAnnotation[] | undefined
): ChatSource[] {
  if (!annotations?.length) return [];

  const sources = annotations
    .map((annotation) => resolveSourceFromCitation(annotation))
    .filter((source): source is ChatSource => source !== null);

  return mergeSources(sources);
}
