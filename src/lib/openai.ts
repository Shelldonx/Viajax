import OpenAI from "openai";

// Cliente OpenAI singleton
let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY não configurada");
    }
    client = new OpenAI({ apiKey });
  }
  return client;
}

const MODEL = process.env.OPENAI_MODEL || "gpt-4o";

// Tipos
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

// Os 5 templates de eBook
export const EBOOK_TEMPLATES: EbookTemplate[] = [
  {
    id: "guia-completo",
    name: "Guia Completo",
    description: "Introdução + por que importa + capítulos detalhados + conclusão + recursos",
    icon: "📖",
    prompt: `Cria um eBook no formato "Guia Completo" com a seguinte estrutura:
1. Introdução cativante — porquê este tema é importante agora
2. Por que importa — o impacto na vida do leitor
3. Capítulos detalhados — cada um com exemplos práticos e accionáveis
4. Conclusão — resumo dos pontos-chave e próximos passos
5. Recursos adicionais — links, ferramentas, leituras recomendadas`,
  },
  {
    id: "tutorial-passo-a-passo",
    name: "Tutorial Passo a Passo",
    description: "Problema + o que vais aprender + passos numerados + erros comuns",
    icon: "🔧",
    prompt: `Cria um eBook no formato "Tutorial Passo a Passo" com a seguinte estrutura:
1. O problema — que dor resolve este tutorial
2. O que vais aprender — lista clara de resultados
3. Pré-requisitos — o que precisas antes de começar
4. Passos numerados — cada passo com instruções claras, screenshots conceptuais
5. Erros comuns — o que NÃO fazer e como evitar
6. Próximos passos — para onde ir depois de completar`,
  },
  {
    id: "guia-viagem",
    name: "Guia de Viagem",
    description: "Destino + quando ir + itinerário dia a dia + dicas secretas",
    icon: "✈️",
    prompt: `Cria um eBook no formato "Guia de Viagem" com a seguinte estrutura:
1. O destino em 3 palavras — primeira impressão emocional
2. Quando ir — melhor época, clima, eventos
3. Itinerário dia a dia — roteiros detalhados por zona
4. Top 10 experiências imperdíveis
5. Dicas de orçamento — como gastar menos sem perder qualidade
6. Segredos locais — o que só quem vive lá sabe`,
  },
  {
    id: "manual-tecnico",
    name: "Manual Técnico",
    description: "Visão geral + conceitos + implementação + exemplos + FAQ",
    icon: "⚙️",
    prompt: `Cria um eBook no formato "Manual Técnico" com a seguinte estrutura:
1. Visão geral — o que é, para quem é, e porquê
2. Conceitos fundamentais — glossário e teoria essencial
3. Como funciona — arquitectura e fluxos
4. Implementação — código, comandos, configurações
5. Exemplos práticos — casos de uso reais
6. Referências — documentação oficial e recursos
7. FAQ — perguntas frequentes com respostas directas`,
  },
  {
    id: "historia-sucesso",
    name: "História de Sucesso",
    description: "O antes + momento de viragem + o método + casos práticos",
    icon: "🏆",
    prompt: `Cria um eBook no formato "História de Sucesso" com a seguinte estrutura:
1. O antes — como era a situação, as dificuldades
2. O momento de viragem — o que mudou tudo
3. O método — o sistema ou processo que trouxe resultados
4. Os 3 pilares — os princípios fundamentais
5. Como aplicar — passos para o leitor replicar
6. Casos práticos — exemplos reais de pessoas que aplicaram
7. A tua vez — motivação final e chamada à acção`,
  },
];

// Analisar PDF com GPT-4o
export async function analyzePdf(pdfText: string): Promise<PdfAnalysis> {
  try {
    const openai = getClient();
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `És um editor profissional de eBooks. Analisa o texto de um PDF e extrai informações estruturadas. Responde SEMPRE em JSON válido com este formato exacto:
{
  "suggestedTitle": "título sugerido para o eBook",
  "chapters": ["capítulo 1", "capítulo 2", ...],
  "keyPoints": ["ponto-chave 1", "ponto-chave 2", ...],
  "targetAudience": "descrição do público-alvo",
  "writingTone": "tom de escrita detectado",
  "summary": "resumo de 2-3 frases do conteúdo"
}`,
        },
        {
          role: "user",
          content: `Analisa este texto extraído de um PDF e devolve a análise em JSON:\n\n${pdfText.slice(0, 15000)}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Resposta vazia do GPT-4o");

    return JSON.parse(content) as PdfAnalysis;
  } catch (erro) {
    console.error("[OpenAI] Erro ao analisar PDF:", (erro as Error).message);
    throw erro;
  }
}

// Gerar eBook com template escolhido
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
          content: `És um escritor profissional de eBooks. Gera conteúdo de alta qualidade em Markdown. O eBook deve ser completo, profissional e pronto a publicar. Escreve em português europeu.`,
        },
        {
          role: "user",
          content: `Gera um eBook baseado nesta análise e template:

ANÁLISE DO CONTEÚDO ORIGINAL:
- Título sugerido: ${analysis.suggestedTitle}
- Capítulos detectados: ${analysis.chapters.join(", ")}
- Pontos-chave: ${analysis.keyPoints.join(", ")}
- Público-alvo: ${analysis.targetAudience}
- Tom de escrita: ${analysis.writingTone}
- Resumo: ${analysis.summary}

TEMPLATE ESCOLHIDO: ${template.name}
${template.prompt}

${customInstructions ? `INSTRUÇÕES ADICIONAIS DO CREATOR:\n${customInstructions}` : ""}

Gera o eBook completo em Markdown com formatação profissional. Inclui emojis subtis nos títulos. Mínimo 3000 palavras.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 8000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Resposta vazia do GPT-4o");

    return content;
  } catch (erro) {
    console.error("[OpenAI] Erro ao gerar eBook:", (erro as Error).message);
    throw erro;
  }
}
