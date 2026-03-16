"use client";

import { useState } from "react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type UploadState =
  | { status: "idle" }
  | { status: "uploading" }
  | { status: "indexed"; documentId: string }
  | { status: "error"; message: string };

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>({ status: "idle" });
   const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    setFile(nextFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploadState({ status: "uploading" });

    try {
      const formData = new FormData();
      formData.append("file", file);
        console.log("[mukulGPT] Uploading file:", {
          name: file.name,
          size: file.size,
          type: file.type
        });
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Upload failed");
      }

      const data = (await response.json()) as { documentId: string };
      setUploadState({ status: "indexed", documentId: data.documentId });
      setMessages([]);
    } catch (error) {
        console.error("[mukulGPT] Upload error:", error);
      setUploadState({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    if (uploadState.status !== "indexed") return;

    const question = input.trim();
    setInput("");

    const userMessage: ChatMessage = {
      id: String(Date.now()),
      role: "user",
      content: question
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsThinking(true);

    try {
        console.log("[mukulGPT] Sending chat message:", {
          documentId: uploadState.documentId,
          question
        });

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: uploadState.documentId,
          message: question
        })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Chat request failed");
      }

      const data = (await response.json()) as { answer: string };

      const assistantMessage: ChatMessage = {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        content: data.answer
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
        console.error("[mukulGPT] Chat error:", error);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.3fr)]">
      <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4 shadow-sm">
        <h2 className="text-sm font-medium text-slate-200">
          1. Upload a PDF
        </h2>
        <p className="text-xs text-slate-400">
          Choose a PDF up to 20 MB. mukulGPT will index it locally and prepare
          it for question answering.
        </p>
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-700 bg-slate-900/60 p-6 text-center text-xs text-slate-400 hover:border-sky-500/60 hover:bg-slate-900">
          <span className="font-medium text-slate-200">
            {file ? file.name : "Click to select a PDF"}
          </span>
          <span>PDF, up to 20 MB</span>
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
        <button
          type="button"
          onClick={handleUpload}
          disabled={!file || uploadState.status === "uploading"}
          className="inline-flex h-9 items-center justify-center rounded-md bg-sky-600 px-3 text-xs font-medium text-white shadow-sm hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-700"
        >
          {uploadState.status === "uploading" ? "Indexing PDF..." : "Upload & index"}
        </button>
        {uploadState.status === "indexed" ? (
          <p className="text-[11px] text-emerald-400">
            PDF indexed. You can start chatting on the right.
          </p>
        ) : null}
        {uploadState.status === "error" ? (
          <p className="text-[11px] text-rose-400">
            Upload failed: {uploadState.message}
          </p>
        ) : null}
      </section>

      <section className="flex min-h-[320px] flex-col rounded-xl border border-slate-800 bg-slate-900/40 p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-medium text-slate-200">
          2. Chat with your PDF
        </h2>
        <div className="flex flex-1 flex-col rounded-lg border border-slate-800 bg-slate-950/40">
          <div className="flex-1 space-y-3 overflow-y-auto p-3 text-xs">
            {messages.length === 0 ? (
              <p className="mt-8 text-center text-slate-500">
                {uploadState.status === "indexed"
                  ? "Ask your first question about this PDF."
                  : "Upload a PDF on the left to begin."}
              </p>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={
                    message.role === "user"
                      ? "ml-auto max-w-[85%] rounded-lg bg-sky-600 px-3 py-2 text-right text-[11px] text-white"
                      : "mr-auto max-w-[85%] rounded-lg bg-slate-800 px-3 py-2 text-left text-[11px] text-slate-50"
                  }
                >
                  {message.content}
                </div>
              ))
            )}
            {isThinking ? (
              <p className="text-[11px] text-slate-500">Thinking...</p>
            ) : null}
          </div>
          <div className="border-t border-slate-800 p-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void handleSend();
                  }
                }}
                disabled={uploadState.status !== "indexed"}
                placeholder={
                  uploadState.status === "indexed"
                    ? "Ask something about your PDF..."
                    : "Upload a PDF to start chatting..."
                }
                className="h-8 flex-1 rounded-md border border-slate-700 bg-slate-950 px-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  void handleSend();
                }}
                disabled={uploadState.status !== "indexed" || isThinking || !input.trim()}
                className="inline-flex h-8 items-center justify-center rounded-md bg-sky-600 px-3 text-[11px] font-medium text-white shadow-sm hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-700"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

