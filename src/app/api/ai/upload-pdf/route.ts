import { NextRequest, NextResponse } from "next/server";
import { analyzePdf } from "@/lib/openai";

// POST — receber PDF, extrair texto, analisar com GPT-4o
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Ficheiro PDF é obrigatório" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Apenas ficheiros PDF são aceites" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "O ficheiro não pode exceder 10MB" }, { status: 400 });
    }

    // Extrair texto do PDF
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse") as (buffer: Buffer) => Promise<{ text: string; numpages: number }>;
    const pdfData = await pdfParse(buffer);

    if (!pdfData.text || pdfData.text.trim().length < 100) {
      return NextResponse.json({ error: "O PDF não contém texto suficiente para análise" }, { status: 400 });
    }

    // Analisar com GPT-4o
    const analysis = await analyzePdf(pdfData.text);

    return NextResponse.json({
      analysis,
      pages: pdfData.numpages,
      textLength: pdfData.text.length,
    });
  } catch (erro) {
    console.error("[API Upload PDF] Erro:", (erro as Error).message);
    return NextResponse.json({ error: "Erro ao processar PDF" }, { status: 500 });
  }
}
