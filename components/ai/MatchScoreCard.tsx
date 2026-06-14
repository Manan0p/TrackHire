"use client";

import { useState } from "react";
import { Loader2, Zap, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import type { ApplicationWithRelations, MatchScoreResult } from "@/types";

interface MatchScoreCardProps {
  application: ApplicationWithRelations;
  onScoreUpdate: (score: number, notes: string) => void;
}

export function MatchScoreCard({ application, onScoreUpdate }: MatchScoreCardProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MatchScoreResult | null>(null);

  const hasScore = application.matchScore !== null && application.matchScore !== undefined;

  const handleScore = async () => {
    if (!application.jobDescription) {
      toast.error("Add the job description in the Notes tab first");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/ai/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: application.id }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to score");
      }
      const data: MatchScoreResult = await res.json();
      setResult(data);
      onScoreUpdate(data.score, data.strengthSummary);
      toast.success("Match score computed!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to score";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const score = result?.score ?? application.matchScore;
  const scoreColor =
    score === null || score === undefined ? "#6B7280"
    : score >= 80 ? "#10B981"
    : score >= 60 ? "#F59E0B"
    : "#F43F5E";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-[var(--foreground)]">Resume Match Score</h3>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-[12px] gap-1"
          onClick={handleScore}
          disabled={loading}
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
          {loading ? "Scoring…" : hasScore ? "Re-score" : "Score Match"}
        </Button>
      </div>

      {score !== null && score !== undefined ? (
        <div className="p-4 border border-[var(--border)] rounded-xl space-y-4">
          {/* Score ring */}
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="26" fill="none" stroke="var(--border)" strokeWidth="6" />
                <circle
                  cx="32" cy="32" r="26"
                  fill="none"
                  stroke={scoreColor}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 26}`}
                  strokeDashoffset={`${2 * Math.PI * 26 * (1 - score / 100)}`}
                  style={{ transition: "stroke-dashoffset 0.8s ease" }}
                />
              </svg>
              <span
                className="absolute inset-0 flex items-center justify-center text-[15px] font-bold"
                style={{ color: scoreColor }}
              >
                {score}
              </span>
            </div>
            <div>
              <p className="text-[13px] font-medium" style={{ color: scoreColor }}>
                {score >= 80 ? "Strong Match" : score >= 60 ? "Good Match" : "Weak Match"}
              </p>
              {(result?.strengthSummary || application.aiNotes) && (
                <p className="text-[12px] text-[var(--text-muted)] mt-1 leading-relaxed">
                  {result?.strengthSummary || application.aiNotes?.split("\n\n")[0]}
                </p>
              )}
            </div>
          </div>

          {result && (
            <>
              {/* Matched skills */}
              {result.matchedSkills.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-green-600 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Matched Skills
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {result.matchedSkills.map((skill) => (
                      <span key={skill} className="text-[11px] px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing skills */}
              {result.missingSkills.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-red-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> Missing Skills
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {result.missingSkills.map((skill) => (
                      <span key={skill} className="text-[11px] px-2 py-0.5 bg-red-50 text-red-600 border border-red-200 rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestion */}
              {result.suggestion && (
                <div className="p-3 bg-[var(--primary-light)] border border-[#0F6E5630] rounded-lg">
                  <p className="text-[11px] font-semibold text-[var(--primary)] uppercase tracking-wide mb-1">
                    Interview Tip
                  </p>
                  <p className="text-[12px] text-[var(--primary-dark)] leading-relaxed">{result.suggestion}</p>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="p-6 border border-dashed border-[var(--border)] rounded-xl text-center">
          <Zap className="w-8 h-8 text-[var(--text-subtle)] mx-auto mb-2" />
          <p className="text-[13px] font-medium text-[var(--text-muted)]">No match score yet</p>
          <p className="text-[12px] text-[var(--text-subtle)] mt-1 mb-3">
            Add your resume in Settings and the job description in Notes, then score this match
          </p>
        </div>
      )}
    </div>
  );
}
