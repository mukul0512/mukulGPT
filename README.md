## mukulgpt

Chat with your PDFs locally using Next.js, React Compiler, and a local Ollama LLM + embeddings.
mukulGPT is a local RAG (Retrieval-Augmented Generation) app: you upload a PDF, it is indexed locally, and you chat with it. Answers are based on the PDF content, using a local LLM and embeddings. No cloud AI or external APIs are required; data stays on your machine.

### Tech stack

- **Frontend**: Next.js 14 (App Router, TypeScript, Tailwind, React Compiler enabled)
- **Backend/API**: Next.js Route Handlers (`/api/upload`, `/api/chat`)
- **AI**: Ollama for chat + embeddings (e.g. `llama3`, `nomic-embed-text`)
- **Retrieval**: Simple JSON-based vector store (`storage/vectors.json`)

### Prerequisites

- Node.js 18+
- npm
- [Ollama](https://ollama.com/) installed and running locally
  - `ollama pull llama3`
  - `ollama pull nomic-embed-text`

### Local setup

```bash
cd mukulGPT
cp .env.example .env.local
npm install
npm run dev
```

By default, the app expects Ollama at `http://localhost:11434`. You can change this in `.env.local`.

### Usage

1. Open `http://localhost:3000` in your browser.
2. Upload a PDF (up to ~20 MB).
3. Wait for indexing to complete.
4. Ask questions about the PDF in the chat panel on the right.

All PDFs and vector data are stored locally under `mukulGPT/storage/` (gitignored).

# mukulgpt