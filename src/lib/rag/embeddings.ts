const DEFAULT_OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
const DEFAULT_EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL ?? "nomic-embed-text";

export async function getEmbeddings(texts: string[]): Promise<number[][]> {
  if (!texts.length) return [];

  const url = `${DEFAULT_OLLAMA_BASE_URL}/api/embeddings`;
    console.log("[mukulGPT] Requesting embeddings from Ollama:", {
      url,
      model: DEFAULT_EMBED_MODEL,
      count: texts.length
    });
  let response: Response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: DEFAULT_EMBED_MODEL,
        input: texts
      })
    });
  } catch (error) {
      console.error("[mukulGPT] Embeddings fetch failed:", {
        url,
        model: DEFAULT_EMBED_MODEL,
        error
      });
    throw new Error(
      `Failed to reach Ollama embeddings endpoint at ${url}. ` +
        (error instanceof Error ? `Original error: ${error.message}` : "Unknown network error.")
    );
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Ollama embeddings error: ${text || response.statusText}`);
  }

  const data = (await response.json()) as {
    embeddings?: number[][];
    embedding?: number[];
    [key: string]: unknown;
  };

  const embeddingsArray: number[][] | undefined =
    (Array.isArray(data.embeddings) && data.embeddings) ||
    (Array.isArray(data.embedding) && [data.embedding]) ||
    (Array.isArray((data as any).data) &&
      (data as any).data.every((item: any) => Array.isArray(item?.embedding)) &&
      (data as any).data.map((item: any) => item.embedding as number[]));
    console.log("[mukulGPT] Parsed embeddings response:", {
      hasEmbeddingsProp: Array.isArray((data as any).embeddings),
      hasEmbeddingProp: Array.isArray((data as any).embedding),
      dataArrayLength: Array.isArray((data as any).data) ? (data as any).data.length : undefined,
      embeddingsLength: embeddingsArray?.length
    });

  if (!embeddingsArray || embeddingsArray.length === 0) {
    throw new Error("Embeddings response from Ollama did not contain any embeddings");
  }

  return embeddingsArray;
}

