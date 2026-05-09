import OpenAI from "openai";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }
    client = new OpenAI({ apiKey });
  }
  return client;
}

const MODEL = process.env.OPENAI_MODEL || "gpt-4o";

export interface PdfAnalysis {
  suggestedTitle: string;
  chapters: string[];
  keyPoints: string[];
  targetAudience: string;
  writingTone: string;
  summary: string;
}

export interface EbookTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  prompt: string;
}

export const EBOOK_TEMPLATES: EbookTemplate[] = [
  {
    id: "complete-guide",
    name: "Complete Guide",
    description: "Intro + chapters + conclusion + resources",
    icon: "📖",
    prompt: `Create a digital product in the "Complete Guide" format with this structure:
1. Engaging introduction -- why this topic matters right now
2. Why it matters -- the impact on the reader's life
3. Detailed chapters -- each with practical, actionable examples
4. Conclusion -- summary of key points and next steps
5. Additional resources -- links, tools, recommended reading`,
  },
  {
    id: "step-by-step",
    name: "Step by Step Tutorial",
    description: "Problem + what you will learn + numbered steps + common mistakes",
    icon: "🔧",
    prompt: `Create a digital product in the "Step by Step Tutorial" format with this structure:
1. The problem -- what pain this tutorial solves
2. What you will learn -- clear list of outcomes
3. Prerequisites -- what you need before starting
4. Numbered steps -- each step with clear instructions
5. Common mistakes -- what NOT to do and how to avoid them
6. Next steps -- where to go after completing this`,
  },
  {
    id: "travel-guide",
    name: "Travel Guide",
    description: "Destination + when to go + day-by-day itinerary + secret tips",
    icon: "✈️",
    prompt: `Create a digital product in the "Travel Guide" format with this structure:
1. The destination in 3 words -- first emotional impression
2. When to go -- best season, weather, events
3. Day-by-day itinerary -- detailed routes by area
4. Top 10 unmissable experiences
5. Budget tips -- how to spend less without losing quality
6. Local secrets -- what only locals know`,
  },
  {
    id: "technical-manual",
    name: "Technical Manual",
    description: "Overview + concepts + implementation + examples + FAQ",
    icon: "⚙️",
    prompt: `Create a digital product in the "Technical Manual" format with this structure:
1. Overview -- what it is, who it's for, and why
2. Core concepts -- glossary and essential theory
3. How it works -- architecture and flows
4. Implementation -- code, commands, configurations
5. Practical examples -- real-world use cases
6. References -- official documentation and resources
7. FAQ -- frequently asked questions with direct answers`,
  },
  {
    id: "success-story",
    name: "Success Story",
    description: "The before + turning point + the method + case studies",
    icon: "🏆",
    prompt: `Create a digital product in the "Success Story" format with this structure:
1. The before -- what the situation was like, the struggles
2. The turning point -- what changed everything
3. The method -- the system or process that brought results
4. The 3 pillars -- the fundamental principles
5. How to apply -- steps for the reader to replicate
6. Case studies -- real examples of people who applied this
7. Your turn -- final motivation and call to action`,
  },
];

// Analyze PDF with GPT-4o
export async function analyzePdf(pdfText: string): Promise<PdfAnalysis> {
  try {
    const openai = getClient();
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `You are a professional digital product editor. Analyze the text from a PDF and extract structured information. ALWAYS respond in valid JSON with this exact format:
{
  "suggestedTitle": "suggested title for the product",
  "chapters": ["chapter 1", "chapter 2", ...],
  "keyPoints": ["key point 1", "key point 2", ...],
  "targetAudience": "description of the target audience",
  "writingTone": "detected writing tone",
  "summary": "2-3 sentence summary of the content"
}`,
        },
        {
          role: "user",
          content: `Analyze this text extracted from a PDF and return the analysis in JSON:\n\n${pdfText.slice(0, 15000)}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response from GPT-4o");

    return JSON.parse(content) as PdfAnalysis;
  } catch (erro) {
    console.error("[OpenAI] Error analyzing PDF:", (erro as Error).message);
    throw erro;
  }
}

// Generate product content with chosen template
export async function generateEbook(
  template: EbookTemplate,
  analysis: PdfAnalysis,
  customInstructions?: string
): Promise<string> {
  try {
    const openai = getClient();
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `You are a professional digital product writer. Generate high-quality content in Markdown format. The product must be complete, professional, and ready to publish. Write in English.`,
        },
        {
          role: "user",
          content: `Generate a complete digital product based on this analysis and template:

ORIGINAL CONTENT ANALYSIS:
- Suggested title: ${analysis.suggestedTitle}
- Detected chapters: ${analysis.chapters.join(", ")}
- Key points: ${analysis.keyPoints.join(", ")}
- Target audience: ${analysis.targetAudience}
- Writing tone: ${analysis.writingTone}
- Summary: ${analysis.summary}

CHOSEN TEMPLATE: ${template.name}
${template.prompt}

${customInstructions ? `ADDITIONAL INSTRUCTIONS FROM CREATOR:\n${customInstructions}` : ""}

Generate the complete product in Markdown with professional formatting. Minimum 3000 words.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 8000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response from GPT-4o");

    return content;
  } catch (erro) {
    console.error("[OpenAI] Error generating product:", (erro as Error).message);
    throw erro;
  }
}
