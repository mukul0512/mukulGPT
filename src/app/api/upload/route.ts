import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { extractPdfText } from "@/lib/pdf/extract";
import { chunkPages } from "@/lib/rag/chunk";
import { getEmbeddings } from "@/lib/rag/embeddings";
import { upsertDocumentChunks } from "@/lib/rag/vectorStore";

export const runtime = "nodejs";

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB
const UPLOAD_DIR = path.join(process.cwd(), "storage", "uploads");

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return new NextResponse("Missing PDF file", { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return new NextResponse("Only PDF files are allowed", { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return new NextResponse("File exceeds 20 MB limit", { status: 413 });
    }

    const documentId = randomUUID();
    const fileName = `${documentId}.pdf`;
    const relativePath = path.join("storage", "uploads", fileName);
    const absolutePath = path.join(process.cwd(), relativePath);

    await mkdir(path.dirname(absolutePath), { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    console.log("[mukulGPT] Saving PDF to:", absolutePath, "size:", buffer.length);
    await writeFile(absolutePath, buffer);
    // Extract text and create chunks
    const pages = await extractPdfText(absolutePath);
    const chunks = chunkPages(documentId, pages);
      console.log("[mukulGPT] Extracted chunks for document:", {
        documentId,
        pageCount: pages.length,
        chunkCount: chunks.length
      });
    // Create embeddings and upsert into local vector store
    const texts = chunks.map((c) => c.text);

    if (!texts.length) {
        console.error("[mukulGPT] No text chunks extracted for document:", {
          documentId,
          pageCount: pages.length,
          chunkCount: chunks.length
        });

      return new NextResponse("No text content found in PDF", { status: 400 });
    }

    const embeddings = await getEmbeddings(texts);

    const embeddingCount = embeddings?.length ?? 0;
    const chunkCount = chunks.length;
    const pairCount = Math.min(chunkCount, embeddingCount);

    if (pairCount === 0) {
      throw new Error("No embeddings returned for extracted chunks");
    }
      console.warn("[mukulGPT] Embeddings/chunks length mismatch, aligning by min count:", {
        documentId,
        chunkCount,
        embeddingCount,
        usedPairs: pairCount
      });
    const alignedChunks = chunks.slice(0, pairCount);
    const alignedEmbeddings = embeddings.slice(0, pairCount);

    await upsertDocumentChunks(documentId, alignedChunks, alignedEmbeddings);

    return NextResponse.json({ documentId });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error while uploading PDF";
      console.error("[mukulGPT] Upload API error:", error);
    return new NextResponse(`Failed to upload PDF: ${message}`, { status: 500 });
  }
}

