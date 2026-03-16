import { NextResponse } from "next/server";
import { getEmbeddings } from "@/lib/rag/embeddings";
import { queryDocumentChunks } from "@/lib/rag/vectorStore";
import { chatWithContext } from "@/lib/rag/llm";

export const runtime = "nodejs";

type ChatRequestBody = {
  documentId: string;
  message: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequestBody;

    if (!body.documentId || !body.message) {
      return new NextResponse("Missing documentId or message", { status: 400 });
    }

    const [questionEmbedding] = await getEmbeddings([body.message]);
    const chunks = await queryDocumentChunks(body.documentId, questionEmbedding, 6);

    if (!chunks.length) {
      return NextResponse.json({
        answer:
          "I could not find any relevant context in this PDF yet. Try re-uploading or asking a different question."
      });
    }

    const contextTexts = chunks.map((c) => c.text);
    const answer = await chatWithContext(body.message, contextTexts);

    return NextResponse.json({
      answer
    });
  } catch (error) {
      console.error("[mukulGPT] Chat API error:", error);
    return new NextResponse("Failed to answer question", { status: 500 });
  }
}

