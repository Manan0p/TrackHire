"use client";

import { useState, useRef } from "react";
import { Loader2, Mail, Copy, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { ApplicationWithRelations } from "@/types";

interface FollowUpDrafterProps {
  application: ApplicationWithRelations;
}

export function FollowUpDrafter({ application }: FollowUpDrafterProps) {
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [contextNote, setContextNote] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    setDraft("");
    try {
      const res = await fetch("/api/ai/followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: application.id, contextNote }),
      });
      if (!res.ok) throw new Error("Failed to generate");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setDraft((prev) => prev + decoder.decode(value));
      }
      toast.success("Follow-up email drafted!");
    } catch {
      toast.error("Failed to generate follow-up email");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(draft);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="space-y-3 border border-[var(--border)] rounded-lg p-4">
      <div className="flex items-center gap-2">
        <Mail className="w-4 h-4 text-[var(--text-muted)]" />
        <h4 className="text-[13px] font-semibold text-[var(--foreground)]">Follow-up Email Drafter</h4>
      </div>

      <Input
        placeholder="Any context? (e.g. 'interviewed 2 weeks ago, no response')"
        value={contextNote}
        onChange={(e) => setContextNote(e.target.value)}
        className="h-8 text-[13px]"
      />

      <Button
        size="sm"
        variant="outline"
        className="h-7 text-[12px] gap-1 w-full"
        onClick={handleGenerate}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : draft ? (
          <RefreshCw className="w-3 h-3" />
        ) : (
          <Mail className="w-3 h-3" />
        )}
        {loading ? "Drafting…" : draft ? "Re-draft" : "Draft Follow-up Email"}
      </Button>

      {draft && (
        <div className="space-y-2 animate-fade-in">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="text-[13px] min-h-[120px] resize-none"
            placeholder="Generated email will appear here…"
          />
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[12px] gap-1"
            onClick={handleCopy}
          >
            <Copy className="w-3 h-3" />
            Copy to Clipboard
          </Button>
        </div>
      )}
    </div>
  );
}
