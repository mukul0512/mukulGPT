import type { PdfPageText } from "@/lib/pdf/extract";

export type ChunkMetadata = {
  id: string;
  documentId: string;
  pageNumber: number;
  chunkIndex: number;
  text: string;
};

type ChunkOptions = {
  maxChars?: number;
  overlapChars?: number;
};

const DEFAULT_MAX_CHARS = 1200;
const DEFAULT_OVERLAP_CHARS = 200;

export function chunkPages(
  documentId: string,
  pages: PdfPageText[],
  options: ChunkOptions = {}
): ChunkMetadata[] {
  const maxChars = options.maxChars ?? DEFAULT_MAX_CHARS;
  const overlap = options.overlapChars ?? DEFAULT_OVERLAP_CHARS;

  const chunks: ChunkMetadata[] = [];

  for (const page of pages) {
    const normalized = normalizeWhitespace(page.text);
    let start = 0;
    let chunkIndex = 0;

    while (start < normalized.length) {
      const end = Math.min(start + maxChars, normalized.length);
      const slice = normalized.slice(start, end);

      if (slice.trim().length > 0) {
        chunks.push({
          id: `${documentId}-${page.pageNumber}-${chunkIndex}`,
          documentId,
          pageNumber: page.pageNumber,
          chunkIndex,
          text: slice
        });
      }

      if (end === normalized.length) break;

      start = end - overlap;
      if (start < 0) start = 0;
      chunkIndex += 1;
    }
  }

  return chunks;
}

function normalizeWhitespace(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

