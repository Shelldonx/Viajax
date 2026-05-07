"use client";

import { cn } from "@/lib/utils";

interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface TemplateSelectorProps {
  templates: Template[];
  selected: string;
  onSelect: (id: string) => void;
}

export default function TemplateSelector({ templates, selected, onSelect }: TemplateSelectorProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {templates.map((template) => (
        <button
          key={template.id}
          onClick={() => onSelect(template.id)}
          className={cn(
            "flex flex-col items-start rounded-xl border p-4 text-left transition-all",
            selected === template.id
              ? "border-teal-500 bg-teal-500/10 shadow-lg shadow-teal-500/10"
              : "border-gray-800 bg-gray-900/50 hover:border-gray-700"
          )}
        >
          <span className="text-2xl">{template.icon}</span>
          <h4 className="mt-2 text-sm font-semibold text-white">{template.name}</h4>
          <p className="mt-1 text-xs text-gray-500">{template.description}</p>
        </button>
      ))}
    </div>
  );
}
