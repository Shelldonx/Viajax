import { NextResponse } from "next/server";
import { EBOOK_TEMPLATES } from "@/lib/openai";

// GET — listar templates disponíveis
export async function GET() {
  return NextResponse.json({
    templates: EBOOK_TEMPLATES.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      icon: t.icon,
    })),
  });
}
