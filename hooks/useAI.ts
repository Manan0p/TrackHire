"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { MatchScoreResult, PrepQuestionsResult } from "@/types";

export function useAI() {
  const [matchLoading, setMatchLoading] = useState(false);
  const [prepLoading, setPrepLoading] = useState(false);
  const [followUpLoading, setFollowUpLoading] = useState(false);

  const scoreMatch = useCallback(async (applicationId: string): Promise<MatchScoreResult | null> => {
    setMatchLoading(true);
    try {
      const res = await fetch("/api/ai/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Scoring failed");
      }
      return await res.json();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "AI scoring failed";
      toast.error(msg);
      return null;
    } finally {
      setMatchLoading(false);
    }
  }, []);

  const generatePrep = useCallback(async (applicationId: string): Promise<PrepQuestionsResult | null> => {
    setPrepLoading(true);
    try {
      const res = await fetch("/api/ai/prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId }),
      });
      if (!res.ok) throw new Error("Failed");
      return await res.json();
    } catch {
      toast.error("Failed to generate questions");
      return null;
    } finally {
      setPrepLoading(false);
    }
  }, []);

  const streamFollowUp = useCallback(
    async (
      applicationId: string,
      contextNote: string,
      onChunk: (chunk: string) => void
    ) => {
      setFollowUpLoading(true);
      try {
        const res = await fetch("/api/ai/followup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ applicationId, contextNote }),
        });
        if (!res.ok) throw new Error();
        const reader = res.body?.getReader();
        if (!reader) throw new Error();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          onChunk(decoder.decode(value));
        }
      } catch {
        toast.error("Failed to generate follow-up");
      } finally {
        setFollowUpLoading(false);
      }
    },
    []
  );

  return { scoreMatch, generatePrep, streamFollowUp, matchLoading, prepLoading, followUpLoading };
}
