"use client";

import { useState } from "react";
import { Loader2, BookOpen, ChevronDown, ChevronUp, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ApplicationWithRelations, PrepQuestionsResult, PrepQuestion } from "@/types";

interface PrepQuestionsPanelProps {
  application: ApplicationWithRelations;
}

export function PrepQuestionsPanel({ application }: PrepQuestionsPanelProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PrepQuestionsResult | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    behavioural: true,
    technical: false,
    companySpecific: false,
  });

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: application.id }),
      });
      if (!res.ok) throw new Error("Failed to generate questions");
      const data = await res.json();
      setResult(data);
      toast.success("Interview questions generated!");
    } catch {
      toast.error("Failed to generate questions");
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const sections = result
    ? [
        { key: "behavioural", label: "Behavioural", questions: result.behavioural, color: "#3B82F6" },
        { key: "technical", label: "Technical", questions: result.technical, color: "#F59E0B" },
        { key: "companySpecific", label: `${application.company} Specific`, questions: result.companySpecific, color: "#8B5CF6" },
      ]
    : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-[var(--foreground)]">Interview Prep</h3>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-[12px] gap-1"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <BookOpen className="w-3 h-3" />}
          {loading ? "Generating…" : result ? "Regenerate" : "Generate Questions"}
        </Button>
      </div>

      {result ? (
        <div className="space-y-2">
          {sections.map(({ key, label, questions, color }) => (
            <div key={key} className="border border-[var(--border)] rounded-lg overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-[var(--background)] transition-colors"
                onClick={() => toggleSection(key)}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-[13px] font-medium">{label}</span>
                  <span className="text-[11px] text-[var(--text-muted)]">({questions.length})</span>
                </div>
                {openSections[key] ? (
                  <ChevronUp className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                )}
              </button>

              {openSections[key] && (
                <div className="px-3 pb-3 space-y-2.5 border-t border-[var(--border)]">
                  {questions.map((q, i) => (
                    <QuestionItem key={i} question={q} index={i + 1} color={color} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 border border-dashed border-[var(--border)] rounded-xl text-center">
          <BookOpen className="w-8 h-8 text-[var(--text-subtle)] mx-auto mb-2" />
          <p className="text-[13px] font-medium text-[var(--text-muted)]">No prep questions yet</p>
          <p className="text-[12px] text-[var(--text-subtle)] mt-1">
            Generate personalized behavioural, technical, and company-specific questions
          </p>
        </div>
      )}
    </div>
  );
}

function QuestionItem({
  question,
  index,
  color,
}: {
  question: PrepQuestion;
  index: number;
  color: string;
}) {
  const [showHint, setShowHint] = useState(false);

  return (
    <div className="pt-2">
      <p className="text-[13px] text-[var(--foreground)] leading-relaxed">
        <span className="font-semibold mr-1.5" style={{ color }}>
          {index}.
        </span>
        {question.question}
      </p>
      <button
        className="flex items-center gap-1 mt-1.5 text-[11px] text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
        onClick={() => setShowHint((h) => !h)}
      >
        <Lightbulb className="w-3 h-3" />
        {showHint ? "Hide hint" : "Show hint"}
      </button>
      {showHint && (
        <p className="mt-1.5 text-[12px] text-[var(--text-muted)] leading-relaxed pl-3 border-l-2 border-[var(--border)] animate-fade-in">
          {question.hint}
        </p>
      )}
    </div>
  );
}
