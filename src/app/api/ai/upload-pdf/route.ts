import { NextRequest, NextResponse } from "next/server";
import { analyzePdf } from "@/lib/openai";
import * as pdfParse from "pdf-parse";

// POST — receive PDF, extract text, analyze with GPT-4o
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are accepted" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File cannot exceed 10MB" }, { status: 400 });
    }

    // Extract text from PDF
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let pdfData: { text: string; numpages: number };
    try {
      const parseFn = (pdfParse as unknown as { default?: typeof pdfParse }).default || pdfParse;
      pdfData = await (parseFn as unknown as (buf: Buffer) => Promise<{ text: string; numpages: number }>)(buffer);
    } catch (pdfError) {
      console.error("[API Upload PDF] PDF parse error:", pdfError);
      return NextResponse.json({ error: "Failed to read PDF. Make sure it contains readable text (not scanned images)." }, { status: 400 });
    }

    if (!pdfData.text || pdfData.text.trim().length < 100) {
      return NextResponse.json({ error: "PDF does not contain enough text for analysis (minimum 100 characters)" }, { status: 400 });
    }

    // Analyze with GPT-4o
    const analysis = await analyzePdf(pdfData.text);

    return NextResponse.json({
      analysis,
      pages: pdfData.numpages,
      textLength: pdfData.text.length,
    });
  } catch (erro) {
    console.error("[API Upload PDF] Error:", (erro as Error).message);
    return NextResponse.json({ error: "Error processing PDF. Please try again." }, { status: 500 });
  }
}
