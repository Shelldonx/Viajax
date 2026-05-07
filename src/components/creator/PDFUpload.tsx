"use client";

import { useState, useCallback } from "react";
import { Upload, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PDFUploadProps {
  onUpload: (file: File) => void;
  loading?: boolean;
}

export default function PDFUpload({ onUpload, loading }: PDFUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile && droppedFile.type === "application/pdf") {
        if (droppedFile.size > 10 * 1024 * 1024) {
          alert("O ficheiro não pode exceder 10MB");
          return;
        }
        setFile(droppedFile);
        onUpload(droppedFile);
      } else {
        alert("Apenas ficheiros PDF são aceites");
      }
    },
    [onUpload]
  );

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      if (selectedFile.size > 10 * 1024 * 1024) {
        alert("O ficheiro não pode exceder 10MB");
        return;
      }
      setFile(selectedFile);
      onUpload(selectedFile);
    }
  }

  function removeFile() {
    setFile(null);
  }

  if (file) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-teal-500/30 bg-teal-500/5 p-4">
        <FileText className="h-8 w-8 text-teal-400" />
        <div className="flex-1">
          <p className="text-sm font-medium text-white">{file.name}</p>
          <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
        </div>
        {!loading && (
          <button onClick={removeFile} className="text-gray-500 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 transition-all",
        dragActive
          ? "border-teal-500 bg-teal-500/5"
          : "border-gray-700 bg-gray-900/30 hover:border-gray-600"
      )}
    >
      <Upload className={cn("h-10 w-10", dragActive ? "text-teal-400" : "text-gray-600")} />
      <p className="mt-4 text-sm font-medium text-gray-300">
        Arrasta o teu PDF aqui
      </p>
      <p className="mt-1 text-xs text-gray-600">ou clica para seleccionar (máx. 10MB)</p>
      <input
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileSelect}
        className="absolute inset-0 cursor-pointer opacity-0"
        style={{ position: "absolute", inset: 0 }}
      />
    </div>
  );
}
