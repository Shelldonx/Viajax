import { NextRequest, NextResponse } from "next/server";
import { generateEbook, EBOOK_TEMPLATES } from "@/lib/openai";
import type { PdfAnalysis } from "@/lib/openai";

// POST — gerar eBook com template escolhido
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { templateId, analysis, customInstructions } = body as {
      templateId: string;
      analysis: PdfAnalysis;
      customInstructions?: string;
    };

    if (!templateId || !analysis) {
      return NextResponse.json({ error: "templateId and analysis are required" }, { status: 400 });
    }

    const template = EBOOK_TEMPLATES.find((t) => t.id === templateId);
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const content = await generateEbook(template, analysis, customInstructions);

    return NextResponse.json({ content, template: template.name });
  } catch (erro) {
    console.error("[API Generate eBook] Error:", (erro as Error).message);
    return NextResponse.json({ error: "Error generating product" }, { status: 500 });
  }
}
