"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PDFUpload from "./PDFUpload";
import TemplateSelector from "./TemplateSelector";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { cn } from "@/lib/utils";
import { Upload, Layout, Sparkles, Rocket, Check, RefreshCw, FileUp, Package } from "lucide-react";

interface PdfAnalysis {
  suggestedTitle: string;
  chapters: string[];
  keyPoints: string[];
  targetAudience: string;
  writingTone: string;
  summary: string;
}

const TEMPLATES = [
  { id: "complete-guide", name: "Complete Guide", description: "Intro + chapters + conclusion + resources", icon: "📖" },
  { id: "step-by-step", name: "Step by Step Tutorial", description: "Problem + numbered steps + common mistakes", icon: "🔧" },
  { id: "travel-guide", name: "Travel Guide", description: "Destination + day-by-day itinerary + secret tips", icon: "✈️" },
  { id: "technical-manual", name: "Technical Manual", description: "Concepts + implementation + examples + FAQ", icon: "⚙️" },
  { id: "success-story", name: "Success Story", description: "The before + turning point + the method", icon: "🏆" },
];

const CATEGORIES = ["Travel", "Business", "Tech", "Lifestyle", "Education"];

const STEPS_AI = [
  { label: "Upload", icon: Upload },
  { label: "Template", icon: Layout },
  { label: "Generate", icon: Sparkles },
  { label: "Publish", icon: Rocket },
];

const LOADING_MESSAGES = [
  "Creating the structure...",
  "Writing the chapters...",
  "Adding practical examples...",
  "Finalizing your product...",
];

type CreationMode = null | "upload" | "ai";

export default function AIStudio() {
  const router = useRouter();
  const [mode, setMode] = useState<CreationMode>(null);
  const [step, setStep] = useState(0);
  const [analysis, setAnalysis] = useState<PdfAnalysis | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("9.99");
  const [category, setCategory] = useState("Travel");
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [loadingPublish, setLoadingPublish] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Upload PDF for AI analysis
  async function handleUpload(file: File) {
    setLoadingUpload(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/ai/upload-pdf", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error analyzing PDF");
      }
      const data = await res.json();

      setAnalysis(data.analysis);
      setTitle(data.analysis.suggestedTitle);
      setDescription(data.analysis.summary || "");
      setStep(1);
    } catch (erro) {
      alert((erro as Error).message || "Error analyzing PDF. Please try again.");
      console.error(erro);
    } finally {
      setLoadingUpload(false);
    }
  }

  // Generate product with AI
  async function handleGenerate() {
    if (!analysis || !selectedTemplate) return;
    setLoadingGenerate(true);

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
      if (!res.ok) throw new Error("Error generating product");
      const data = await res.json();
      setGeneratedContent(data.content);
      setStep(3);
    } catch (erro) {
      alert("Error generating product. Please try again.");
      console.error(erro);
    } finally {
      clearInterval(interval);
      setLoadingGenerate(false);
    }
  }

  // Publish product
  async function handlePublish() {
    setLoadingPublish(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || analysis?.summary || "",
          price: parseFloat(price),
          category,
          template: selectedTemplate || null,
          content: generatedContent || null,
        }),
      });
      if (!res.ok) throw new Error("Error publishing product");
      router.push("/dashboard/products");
    } catch (erro) {
      alert("Error publishing. Please try again.");
      console.error(erro);
    } finally {
      setLoadingPublish(false);
    }
  }

  // Handle file upload for "I have it ready" mode
  function handleReadyFileSelect(file: File) {
    setUploadedFile(file);
  }

  // Mode selection screen
  if (mode === null) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-white">How would you like to create your product?</h2>
          <p className="mt-2 text-sm text-gray-400">Choose whether you already have a ready product or want AI to create one for you.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Option 1: Already have it ready */}
          <button
            onClick={() => setMode("upload")}
            className="flex flex-col items-center rounded-2xl border border-gray-800 bg-gray-900/50 p-8 text-center transition-all hover:border-teal-500/50 hover:shadow-lg hover:shadow-teal-500/5"
          >
            <div className="mb-4 rounded-xl bg-teal-500/10 p-4">
              <Package className="h-8 w-8 text-teal-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">I have it ready</h3>
            <p className="mt-2 text-sm text-gray-500">
              Upload your file (PDF, ZIP, etc.) and fill in the details to publish immediately.
            </p>
          </button>

          {/* Option 2: Create with AI */}
          <button
            onClick={() => setMode("ai")}
            className="flex flex-col items-center rounded-2xl border border-gray-800 bg-gray-900/50 p-8 text-center transition-all hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/5"
          >
            <div className="mb-4 rounded-xl bg-orange-500/10 p-4">
              <Sparkles className="h-8 w-8 text-orange-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Create with AI</h3>
            <p className="mt-2 text-sm text-gray-500">
              Upload a PDF and our AI will transform it into a professional product using GPT-4o.
            </p>
          </button>
        </div>
      </div>
    );
  }

  // Mode: Upload ready product
  if (mode === "upload") {
    return (
      <div className="mx-auto max-w-2xl">
        <button
          onClick={() => setMode(null)}
          className="mb-6 text-sm text-gray-500 hover:text-white transition-colors"
        >
          ← Back to options
        </button>

        <h2 className="text-xl font-bold text-white">Upload your product</h2>
        <p className="mt-1 text-sm text-gray-400">Fill in the details and upload your file to publish on the marketplace.</p>

        <div className="mt-6 space-y-4">
          <Input id="title" label="Title" placeholder="My Amazing Digital Product" value={title} onChange={(e) => setTitle(e.target.value)} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">Description</label>
            <textarea
              placeholder="What does your product cover? Who is it for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-gray-700 bg-gray-800/50 p-4 text-sm text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none"
              rows={4}
            />
          </div>
          <Input id="price" label="Price (USD)" type="number" step="0.01" min="0.99" value={price} onChange={(e) => setPrice(e.target.value)} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">Category</label>
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

          {/* File upload */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">Product File</label>
            {uploadedFile ? (
              <div className="flex items-center gap-3 rounded-xl border border-teal-500/30 bg-teal-500/5 p-4">
                <FileUp className="h-6 w-6 text-teal-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{uploadedFile.name}</p>
                  <p className="text-xs text-gray-500">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button onClick={() => setUploadedFile(null)} className="text-gray-500 hover:text-white text-sm">Remove</button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-gray-700 bg-gray-900/30 p-8 transition-all hover:border-gray-600">
                <FileUp className="h-8 w-8 text-gray-600" />
                <p className="mt-3 text-sm text-gray-300">Click to upload your file</p>
                <p className="mt-1 text-xs text-gray-600">PDF, ZIP, EPUB — max 50MB</p>
                <input
                  type="file"
                  accept=".pdf,.zip,.epub,.doc,.docx"
                  onChange={(e) => { if (e.target.files?.[0]) handleReadyFileSelect(e.target.files[0]); }}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <Button fullWidth size="lg" loading={loadingPublish} disabled={!title || !price} onClick={handlePublish}>
            <Rocket className="h-5 w-5" />
            Publish to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  // Mode: Create with AI
  return (
    <div className="mx-auto max-w-3xl">
      <button
        onClick={() => { setMode(null); setStep(0); setAnalysis(null); }}
        className="mb-6 text-sm text-gray-500 hover:text-white transition-colors"
      >
        ← Back to options
      </button>

      {/* Stepper */}
      <div className="mb-10 flex items-center justify-between">
        {STEPS_AI.map((s, i) => (
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
            {i < STEPS_AI.length - 1 && (
              <div className={cn(
                "mx-4 h-px w-8 sm:w-16",
                i < step ? "bg-teal-500" : "bg-gray-800"
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      {step === 0 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white">Upload your PDF</h2>
            <p className="mt-1 text-sm text-gray-400">AI will analyze your content and suggest the best structure.</p>
          </div>
          <div className="relative">
            <PDFUpload onUpload={handleUpload} loading={loadingUpload} />
          </div>
          {loadingUpload && <LoadingSpinner text="Reading your PDF with AI... please wait" />}
        </div>
      )}

      {step === 1 && analysis && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white">PDF Analysis</h2>
            <p className="mt-1 text-sm text-gray-400">AI analyzed your content. Choose a template.</p>
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 space-y-3">
            <div><span className="text-xs text-gray-500">Suggested title:</span> <span className="text-sm text-white">{analysis.suggestedTitle}</span></div>
            <div><span className="text-xs text-gray-500">Chapters:</span> <span className="text-sm text-gray-300">{analysis.chapters.join(", ")}</span></div>
            <div><span className="text-xs text-gray-500">Target audience:</span> <span className="text-sm text-gray-300">{analysis.targetAudience}</span></div>
          </div>

          <TemplateSelector templates={TEMPLATES} selected={selectedTemplate} onSelect={setSelectedTemplate} />

          <textarea
            placeholder="Extra instructions for AI (optional)"
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            className="w-full rounded-xl border border-gray-700 bg-gray-800/50 p-4 text-sm text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none"
            rows={3}
          />

          <Button fullWidth size="lg" disabled={!selectedTemplate} onClick={() => setStep(2)}>
            Continue →
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 text-center">
          <div>
            <h2 className="text-xl font-bold text-white">Generate with AI</h2>
            <p className="mt-1 text-sm text-gray-400">Template: {TEMPLATES.find(t => t.id === selectedTemplate)?.name}</p>
          </div>

          {loadingGenerate ? (
            <div className="py-10">
              <LoadingSpinner size="lg" text={loadingMsg} />
            </div>
          ) : (
            <Button size="lg" onClick={handleGenerate}>
              <Sparkles className="h-5 w-5" />
              Generate Product with AI
            </Button>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white">Publish to Marketplace</h2>
            <p className="mt-1 text-sm text-gray-400">Review and publish your product.</p>
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
              Regenerate
            </Button>
          </div>

          <div className="space-y-4">
            <Input id="title" label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Input id="price" label="Price (USD)" type="number" step="0.01" min="0.99" value={price} onChange={(e) => setPrice(e.target.value)} />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">Category</label>
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
              Publish to Marketplace →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
