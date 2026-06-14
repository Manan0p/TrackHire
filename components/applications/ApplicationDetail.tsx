"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { CompanyLogo } from "./CompanyLogo";
import { StatusBadge } from "./StatusBadge";
import { SourceBadge } from "./SourceBadge";
import { EventTimeline } from "./EventTimeline";
import { MatchScoreCard } from "@/components/ai/MatchScoreCard";
import { PrepQuestionsPanel } from "@/components/ai/PrepQuestionsPanel";
import { FollowUpDrafter } from "@/components/ai/FollowUpDrafter";
import { ApplicationWithRelations, EventRecord, STATUS_LABELS } from "@/types";
import { AppStatus } from "@prisma/client";
import { formatDate, formatSalary } from "@/lib/utils";
import { ExternalLink, Mail, Link2, User, DollarSign, Tag, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const ALL_STATUSES: AppStatus[] = [
  "WISHLIST", "APPLIED", "OA", "PHONE", "TECHNICAL",
  "FINAL", "OFFER", "REJECTED", "GHOSTED", "WITHDRAWN",
];

interface ApplicationDetailProps {
  application: ApplicationWithRelations | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (updated: ApplicationWithRelations) => void;
}

export function ApplicationDetail({ application, open, onClose, onUpdate }: ApplicationDetailProps) {
  const [updating, setUpdating] = useState(false);
  const [localApp, setLocalApp] = useState<ApplicationWithRelations | null>(null);
  const current = localApp || application;

  const handleStatusChange = async (status: AppStatus) => {
    if (!current) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/applications/${current.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const updated = await res.json();
      setLocalApp(updated);
      onUpdate(updated);
      toast.success(`Status updated to ${STATUS_LABELS[status]}`);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const handleNotesUpdate = async (notes: string) => {
    if (!current) return;
    try {
      const res = await fetch(`/api/applications/${current.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      const updated = await res.json();
      setLocalApp(updated);
      onUpdate(updated);
    } catch {
      toast.error("Failed to save notes");
    }
  };

  const handleEventAdded = (event: EventRecord) => {
    if (!current) return;
    const updated = { ...current, events: [...current.events, event] };
    setLocalApp(updated as ApplicationWithRelations);
    onUpdate(updated as ApplicationWithRelations);
  };

  const handleEventUpdated = (event: EventRecord) => {
    if (!current) return;
    const updated = {
      ...current,
      events: current.events.map((e) => (e.id === event.id ? event : e)),
    };
    setLocalApp(updated as ApplicationWithRelations);
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:w-[600px] sm:max-w-[600px] p-0 overflow-y-auto">
        {!current ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="sticky top-0 bg-[var(--surface)] border-b border-[var(--border)] px-6 py-4 z-10">
              <div className="flex items-start gap-3">
                <CompanyLogo company={current.company} size={40} />
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-bold text-[var(--foreground)] leading-tight">
                    {current.company}
                  </h2>
                  <p className="text-sm text-[var(--text-muted)] mt-0.5 truncate">
                    {current.role}
                  </p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <SourceBadge source={current.source} />
                    {current.jobUrl && (
                      <a
                        href={current.jobUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-[var(--primary)] hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Job Link
                      </a>
                    )}
                  </div>
                </div>
                <Select
                  value={current.status}
                  onValueChange={(v) => handleStatusChange(v as AppStatus)}
                  disabled={updating}
                >
                  <SelectTrigger className="w-36 h-8 text-[13px]">
                    <SelectValue>
                      <StatusBadge status={current.status} size="sm" />
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="text-[13px]">
                        <StatusBadge status={s} size="sm" />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quick stats */}
              <div className="flex flex-wrap gap-3 mt-3 text-[11px] text-[var(--text-muted)]">
                {current.appliedAt && (
                  <span>Applied {formatDate(current.appliedAt)}</span>
                )}
                {(current.salaryMin || current.salaryMax) && (
                  <span>
                    {formatSalary(current.salaryMin, current.salaryMax, current.currency)}
                  </span>
                )}
                {current.tags.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {current.tags.slice(0, 3).join(", ")}
                  </div>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="px-6 py-4">
              <Tabs defaultValue="timeline">
                <TabsList className="w-full mb-4 bg-[var(--surface-container-low)]">
                  <TabsTrigger value="timeline" className="flex-1 text-[13px]">Timeline</TabsTrigger>
                  <TabsTrigger value="recruiter" className="flex-1 text-[13px]">Recruiter</TabsTrigger>
                  <TabsTrigger value="notes" className="flex-1 text-[13px]">Notes</TabsTrigger>
                  <TabsTrigger value="ai" className="flex-1 text-[13px] gap-1 flex items-center text-[var(--primary)] font-semibold">
                    <span>AI Insights</span>
                    <span className="text-[12px]">✦</span>
                  </TabsTrigger>
                </TabsList>

                {/* Timeline Tab */}
                <TabsContent value="timeline">
                  <EventTimeline
                    events={current.events}
                    applicationId={current.id}
                    onEventAdded={handleEventAdded}
                    onEventUpdated={handleEventUpdated}
                  />
                </TabsContent>

                {/* Recruiter Tab */}
                <TabsContent value="recruiter">
                  <div className="space-y-4">
                    {current.recruiterName || current.recruiterEmail || current.recruiterLinkedIn ? (
                      <div className="p-4 border border-[var(--border)] rounded-lg space-y-3">
                        {current.recruiterName && (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-[var(--text-muted)]" />
                            <span className="text-[13px] font-medium">{current.recruiterName}</span>
                          </div>
                        )}
                        {current.recruiterEmail && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-[var(--text-muted)]" />
                            <a
                              href={`mailto:${current.recruiterEmail}`}
                              className="text-[13px] text-[var(--primary)] hover:underline"
                            >
                              {current.recruiterEmail}
                            </a>
                          </div>
                        )}
                        {current.recruiterLinkedIn && (
                          <div className="flex items-center gap-2">
                            <Link2 className="w-4 h-4 text-[var(--text-muted)]" />
                            <a
                              href={current.recruiterLinkedIn}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[13px] text-[var(--primary)] hover:underline"
                            >
                              LinkedIn Profile
                            </a>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <User className="w-8 h-8 text-[var(--text-subtle)] mx-auto mb-2" />
                        <p className="text-sm text-[var(--text-muted)]">No recruiter info yet</p>
                        <p className="text-xs text-[var(--text-subtle)] mt-1">Edit application to add recruiter details</p>
                      </div>
                    )}

                    {/* Email threads */}
                    {current.emails.length > 0 && (
                      <div>
                        <p className="text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">
                          Email Threads
                        </p>
                        <div className="space-y-2">
                          {current.emails.map((email) => (
                            <div key={email.id} className="p-3 border border-[var(--border)] rounded-lg">
                              <p className="text-[13px] font-medium">{email.subject}</p>
                              {email.snippet && (
                                <p className="text-[11px] text-[var(--text-muted)] mt-0.5 line-clamp-2">
                                  {email.snippet}
                                </p>
                              )}
                              <p className="text-[10px] text-[var(--text-subtle)] mt-1">
                                {formatDate(email.lastMessageAt)} · {email.messageCount} message{email.messageCount !== 1 ? "s" : ""}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Follow-up drafter */}
                    <FollowUpDrafter application={current} />
                  </div>
                </TabsContent>

                {/* Notes Tab */}
                <TabsContent value="notes">
                  <div className="space-y-4">
                    <div>
                      <label className="text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2 block">
                        Notes
                      </label>
                      <NotesEditor
                        value={current.notes || ""}
                        onSave={handleNotesUpdate}
                      />
                    </div>
                    <div>
                      <label className="text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2 block">
                        Job Description
                      </label>
                      <p className="text-[12px] text-[var(--text-subtle)] mb-2">
                        Paste the full JD — used for AI match scoring
                      </p>
                      <NotesEditor
                        value={current.jobDescription || ""}
                        onSave={async (jd) => {
                          const res = await fetch(`/api/applications/${current.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ jobDescription: jd }),
                          });
                          const updated = await res.json();
                          setLocalApp(updated);
                          onUpdate(updated);
                        }}
                        placeholder="Paste full job description here…"
                        rows={8}
                      />
                    </div>

                    {/* Status History */}
                    {current.statusHistory.length > 0 && (
                      <div>
                        <label className="text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2 block">
                          Status History
                        </label>
                        <div className="space-y-1">
                          {current.statusHistory.slice(0, 6).map((h) => (
                            <div key={h.id} className="flex items-center gap-2 text-[12px]">
                              <span className="text-[var(--text-subtle)]">{formatDate(h.changedAt)}</span>
                              <span className="text-[var(--text-muted)]">→</span>
                              <StatusBadge status={h.toStatus} size="sm" />
                              {h.note && <span className="text-[var(--text-subtle)]">· {h.note}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* AI Tab */}
                <TabsContent value="ai">
                  <div className="space-y-6">
                    <MatchScoreCard application={current} onScoreUpdate={(score, notes) => {
                      const updated = { ...current, matchScore: score, aiNotes: notes };
                      setLocalApp(updated as ApplicationWithRelations);
                      onUpdate(updated as ApplicationWithRelations);
                    }} />
                    <PrepQuestionsPanel application={current} />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ─── Notes Editor ─────────────────────────────────────────────────────────────

function NotesEditor({
  value,
  onSave,
  placeholder = "Add your notes here…",
  rows = 5,
}: {
  value: string;
  onSave: (val: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  const [text, setText] = useState(value);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleBlur = async () => {
    if (text === value) return;
    setSaving(true);
    await onSave(text);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="relative">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        rows={rows}
        className="text-[13px] resize-none"
      />
      {saving && (
        <span className="absolute bottom-2 right-2 text-[10px] text-[var(--text-subtle)]">
          Saving…
        </span>
      )}
      {saved && (
        <span className="absolute bottom-2 right-2 text-[10px] text-green-500">
          Saved ✓
        </span>
      )}
    </div>
  );
}
