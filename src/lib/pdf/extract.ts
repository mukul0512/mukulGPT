import { readFile } from "node:fs/promises";
import path from "node:path";

export type PdfPageText = {
  pageNumber: number;
  text: string;
};

export async function extractPdfText(relativePath: string): Promise<PdfPageText[]> {
  const absolutePath = path.isAbsolute(relativePath)
    ? relativePath
    : path.join(process.cwd(), relativePath);

  const fileBuffer = await readFile(absolutePath);

  const { PDFParse } = (await import("pdf-parse")) as typeof import("pdf-parse");
  const parser = new PDFParse({ data: fileBuffer });
  const data = await parser.getText();
  await parser.destroy();
  return [
    {
      pageNumber: 1,
      text: data.text ?? ""
    }
  ];
}

