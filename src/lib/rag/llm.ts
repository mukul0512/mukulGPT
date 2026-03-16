const DEFAULT_OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
const DEFAULT_LLM_MODEL = process.env.OLLAMA_CHAT_MODEL ?? "llama3.2:1b";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function chatWithContext(
  userQuestion: string,
  contextChunks: string[]
): Promise<string> {
  const url = `${DEFAULT_OLLAMA_BASE_URL}/api/chat`;

  const systemPrompt =
    "You are mukulGPT, an assistant that answers questions strictly based on the provided PDF excerpts. " +
    "If the answer is not clearly contained in the context, say you do not know and suggest the user rephrase or ask something else.";

  const context = contextChunks.join("\n\n---\n\n");

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: `Use only the following PDF context to answer the question.\n\nContext:\n${context}\n\nQuestion: ${userQuestion}`
    }
  ];
    console.log("[mukulGPT] Calling Ollama chat:", {
      url,
      model: DEFAULT_LLM_MODEL,
      contextChunks: contextChunks.length
    });
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: DEFAULT_LLM_MODEL,
      messages,
      stream: false
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Ollama chat error: ${text || response.statusText}`);
  }

  const data = (await response.json()) as {
    message: { content: string };
  };

  return data.message?.content ?? "";
}

