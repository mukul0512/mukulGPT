import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "mukulGPT",
  description: "Chat with your PDFs locally using mukulGPT"
};

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-50">
        <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6">
          <header className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
            <h1 className="text-xl font-semibold tracking-tight">
              <span className="rounded bg-sky-500/10 px-2 py-1 text-sky-400">
                mukul
              </span>
              <span className="ml-1">GPT</span>
            </h1>
            <p className="text-xs text-slate-400">
              Upload a PDF and chat with it.
            </p>
          </header>
          <main className="flex-1">{props.children}</main>
        </div>
      </body>
    </html>
  );
}

