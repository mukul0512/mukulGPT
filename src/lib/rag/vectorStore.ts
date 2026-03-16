import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ChunkMetadata } from "@/lib/rag/chunk";

type StoredChunk = ChunkMetadata & {
  embedding: number[];
};

type VectorStoreData = {
  chunks: StoredChunk[];
};

const VECTOR_DIR = path.join(process.cwd(), "storage");
const VECTOR_FILE = path.join(VECTOR_DIR, "vectors.json");

async function loadStore(): Promise<VectorStoreData> {
  try {
    const raw = await readFile(VECTOR_FILE, "utf8");
    const parsed = JSON.parse(raw) as VectorStoreData;
    return {
      chunks: parsed.chunks ?? []
    };
  } catch {
    return { chunks: [] };
  }
}

async function saveStore(data: VectorStoreData): Promise<void> {
  await mkdir(VECTOR_DIR, { recursive: true });
  const json = JSON.stringify(data, null, 2);
  await writeFile(VECTOR_FILE, json, "utf8");
}

export async function upsertDocumentChunks(
  documentId: string,
  metadatas: ChunkMetadata[],
  embeddings: number[][]
): Promise<void> {
  if (metadatas.length !== embeddings.length) {
    throw new Error("Metadata and embeddings length mismatch");
  }

  const store = await loadStore();

  // Remove any existing chunks for this document
  store.chunks = store.chunks.filter((c) => c.documentId !== documentId);

  const nextChunks: StoredChunk[] = metadatas.map((meta, index) => ({
    ...meta,
    embedding: embeddings[index]
  }));

  store.chunks.push(...nextChunks);
    console.log("[mukulGPT] Upserting document chunks into vector store:", {
      documentId,
      added: nextChunks.length
    });
  await saveStore(store);
}

export async function queryDocumentChunks(
  documentId: string,
  queryEmbedding: number[],
  k: number
): Promise<ChunkMetadata[]> {
  const store = await loadStore();
  const candidates = store.chunks.filter((c) => c.documentId === documentId);

  const scored = candidates
    .map((chunk) => ({
      chunk,
      score: cosineSimilarity(queryEmbedding, chunk.embedding)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
    console.log("[mukulGPT] Query vector store:", {
      documentId,
      candidateCount: candidates.length,
      returned: scored.length
    });
  return scored.map((item) => item.chunk);
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i += 1) {
    const va = a[i] ?? 0;
    const vb = b[i] ?? 0;
    dot += va * vb;
    normA += va * va;
    normB += vb * vb;
  }

  if (normA === 0 || normB === 0) return 0;

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

