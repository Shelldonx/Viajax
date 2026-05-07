"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PDFUpload from "./PDFUpload";
import TemplateSelector from "./TemplateSelector";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { cn } from "@/lib/utils";
import { Upload, Layout, Sparkles, Rocket, Check, RefreshCw } from "lucide-react";

interface PdfAnalysis {
  suggestedTitle: string;
  chapters: string[];
  keyPoints: string[];
  targetAudience: string;
  writingTone: string;
  summary: string;
}

const TEMPLATES = [
  { id: "guia-completo", name: "Guia Completo", description: "Intro + capítulos + conclusão + recursos", icon: "📖" },
  { id: "tutorial-passo-a-passo", name: "Tutorial Passo a Passo", description: "Problema + passos numerados + erros comuns", icon: "🔧" },
  { id: "guia-viagem", name: "Guia de Viagem", description: "Destino + itinerário dia a dia + dicas secretas", icon: "✈️" },
  { id: "manual-tecnico", name: "Manual Técnico", description: "Conceitos + implementação + exemplos + FAQ", icon: "⚙️" },
  { id: "historia-sucesso", name: "História de Sucesso", description: "O antes + momento de viragem + o método", icon: "🏆" },
];

const CATEGORIES = ["Viagem", "Negócios", "Tecnologia", "Lifestyle", "Educação"];

const STEPS = [
  { label: "Upload", icon: Upload },
  { label: "Template", icon: Layout },
  { label: "Gerar", icon: Sparkles },
  { label: "Publicar", icon: Rocket },
];

const LOADING_MESSAGES = [
  "A criar a estrutura...",
  "A escrever os capítulos...",
  "A adicionar exemplos práticos...",
  "A finalizar o eBook...",
];

export default function AIStudio() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [analysis, setAnalysis] = useState<PdfAnalysis | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("9.99");
  const [category, setCategory] = useState("Viagem");
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [loadingPublish, setLoadingPublish] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");

  // Passo 1 — Upload PDF
  async function handleUpload(file: File) {
    setLoadingUpload(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/ai/upload-pdf", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Erro ao analisar PDF");
      const data = await res.json();

      setAnalysis(data.analysis);
      setTitle(data.analysis.suggestedTitle);
      setStep(1);
    } catch (erro) {
      alert("Erro ao analisar o PDF. Tenta novamente.");
      console.error(erro);
    } finally {
      setLoadingUpload(false);
    }
  }

  // Passo 3 — Gerar eBook
  async function handleGenerate() {
    if (!analysis || !selectedTemplate) return;
    setLoadingGenerate(true);

    // Mensagens rotativas
    let msgIndex = 0;
    setLoadingMsg(LOADING_MESSAGES[0]);
    const interval = setInterval(() => {
      msgIndex = (msgIndex + 1) % LOADING_MESSAGES.length;
      setLoadingMsg(LOADING_MESSAGES[msgIndex]);
    }, 3000);

    try {
      const res = await fetch("/api/ai/generate-ebook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplate,
          analysis,
          customInstructions,
        }),
      });
      if (!res.ok) throw new Error("Erro ao gerar eBook");
      const data = await res.json();
      setGeneratedContent(data.content);
      setStep(3);
    } catch (erro) {
      alert("Erro ao gerar eBook. Tenta novamente.");
      console.error(erro);
    } finally {
      clearInterval(interval);
      setLoadingGenerate(false);
    }
  }

  // Passo 4 — Publicar
  async function handlePublish() {
    setLoadingPublish(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: analysis?.summary || "",
          price: parseFloat(price),
          category,
          template: selectedTemplate,
          content: generatedContent,
        }),
      });
      if (!res.ok) throw new Error("Erro ao publicar");
      router.push("/dashboard/products");
    } catch (erro) {
      alert("Erro ao publicar. Tenta novamente.");
      console.error(erro);
    } finally {
      setLoadingPublish(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Stepper */}
      <div className="mb-10 flex items-center justify-between">
        {STEPS.map((s, i) => (
          <div key={s.label} className="flex items-center">
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full transition-all",
              i <= step ? "bg-teal-500 text-white" : "bg-gray-800 text-gray-500"
            )}>
              {i < step ? <Check className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
            </div>
            <span className={cn(
              "ml-2 text-sm font-medium",
              i <= step ? "text-white" : "text-gray-500"
            )}>
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={cn(
                "mx-4 h-px w-8 sm:w-16",
                i < step ? "bg-teal-500" : "bg-gray-800"
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Conteúdo de cada passo */}
      {step === 0 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white">Faz upload do teu PDF</h2>
            <p className="mt-1 text-sm text-gray-400">A AI vai analisar o conteúdo e sugerir a melhor estrutura.</p>
          </div>
          <div className="relative">
            <PDFUpload onUpload={handleUpload} loading={loadingUpload} />
          </div>
          {loadingUpload && <LoadingSpinner text="A ler o teu PDF com AI... aguarda um momento" />}
        </div>
      )}

      {step === 1 && analysis && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white">Análise do PDF</h2>
            <p className="mt-1 text-sm text-gray-400">A AI analisou o teu conteúdo. Escolhe um template.</p>
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 space-y-3">
            <div><span className="text-xs text-gray-500">Título sugerido:</span> <span className="text-sm text-white">{analysis.suggestedTitle}</span></div>
            <div><span className="text-xs text-gray-500">Capítulos:</span> <span className="text-sm text-gray-300">{analysis.chapters.join(", ")}</span></div>
            <div><span className="text-xs text-gray-500">Público-alvo:</span> <span className="text-sm text-gray-300">{analysis.targetAudience}</span></div>
          </div>

          <TemplateSelector templates={TEMPLATES} selected={selectedTemplate} onSelect={setSelectedTemplate} />

          <textarea
            placeholder="Instruções extra para a AI (opcional)"
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            className="w-full rounded-xl border border-gray-700 bg-gray-800/50 p-4 text-sm text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none"
            rows={3}
          />

          <Button fullWidth size="lg" disabled={!selectedTemplate} onClick={() => setStep(2)}>
            Continuar →
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 text-center">
          <div>
            <h2 className="text-xl font-bold text-white">Gerar eBook com AI</h2>
            <p className="mt-1 text-sm text-gray-400">Template: {TEMPLATES.find(t => t.id === selectedTemplate)?.name}</p>
          </div>

          {loadingGenerate ? (
            <div className="py-10">
              <LoadingSpinner size="lg" text={loadingMsg} />
            </div>
          ) : (
            <Button size="lg" onClick={handleGenerate}>
              <Sparkles className="h-5 w-5" />
              Gerar eBook com AI
            </Button>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white">Publicar no Marketplace</h2>
            <p className="mt-1 text-sm text-gray-400">Revê e publica o teu eBook.</p>
          </div>

          {/* Preview */}
          <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-800 bg-gray-900/50 p-4">
            <div className="prose prose-sm prose-invert max-w-none">
              <pre className="whitespace-pre-wrap text-xs text-gray-300">{generatedContent.slice(0, 2000)}...</pre>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setStep(2); setGeneratedContent(""); }}>
              <RefreshCw className="h-4 w-4" />
              Regenerar
            </Button>
          </div>

          <div className="space-y-4">
            <Input id="title" label="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Input id="price" label="Preço (USD)" type="number" step="0.01" min="0.99" value={price} onChange={(e) => setPrice(e.target.value)} />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-gray-700 bg-gray-800/50 px-4 py-2.5 text-sm text-white focus:border-teal-500 focus:outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <Button fullWidth size="lg" loading={loadingPublish} onClick={handlePublish}>
              <Rocket className="h-5 w-5" />
              Publicar no Marketplace →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
