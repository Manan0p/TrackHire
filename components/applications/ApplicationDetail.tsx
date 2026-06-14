"use client";

import { useState, useEffect, useRef } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EventTimeline } from "./EventTimeline";
import { MatchScoreCard } from "@/components/ai/MatchScoreCard";
import { PrepQuestionsPanel } from "@/components/ai/PrepQuestionsPanel";
import { FollowUpDrafter } from "@/components/ai/FollowUpDrafter";
import { StatusBadge } from "./StatusBadge";
import { SourceBadge } from "./SourceBadge";
import { ApplicationWithRelations, EventRecord, STATUS_LABELS } from "@/types";
import { AppStatus } from "@prisma/client";
import { formatDate, formatSalary } from "@/lib/utils";
import { X, ExternalLink, Mail, Link2, User, Tag, Loader2 } from "lucide-react";
import { toast } from "sonner";

// ── Helpers ─────────────────────────────────────────────────────────────────

const AVATAR_COLORS: [string, string][] = [
  ["#1E3A5F", "#3B82F6"], ["#1C3A2B", "#10B981"], ["#3B1F2B", "#F43F5E"],
  ["#2D1B4E", "#8B5CF6"], ["#3B2A0E", "#F59E0B"], ["#1A3040", "#0EA5E9"],
];

function CompanyAvatar({ company, size = 64 }: { company: string; size?: number }) {
  const idx = company.charCodeAt(0) % AVATAR_COLORS.length;
  const [bg, text] = AVATAR_COLORS[idx];
  return (
    <div style={{
      width: size, height: size, borderRadius: 10, background: bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, fontWeight: 800, color: text,
      fontSize: Math.round(size * 0.38), letterSpacing: "-0.02em",
    }}>
      {company.slice(0, 2).toUpperCase()}
    </div>
  );
}

const ALL_STATUSES: AppStatus[] = [
  "WISHLIST", "APPLIED", "OA", "PHONE", "TECHNICAL",
  "FINAL", "OFFER", "REJECTED", "GHOSTED", "WITHDRAWN",
];

const TABS = ["Timeline", "Recruiter", "Notes", "AI Insights"] as const;
type Tab = typeof TABS[number];

// ── Props ────────────────────────────────────────────────────────────────────

interface ApplicationDetailProps {
  application: ApplicationWithRelations | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (updated: ApplicationWithRelations) => void;
}

// ── Component ────────────────────────────────────────────────────────────────

export function ApplicationDetail({ application, open, onClose, onUpdate }: ApplicationDetailProps) {
  const [updating, setUpdating] = useState(false);
  const [localApp, setLocalApp] = useState<ApplicationWithRelations | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("Timeline");
  const drawerRef = useRef<HTMLDivElement>(null);

  const current = localApp || application;

  // Reset local state when application changes
  useEffect(() => {
    setLocalApp(null);
    setActiveTab("Timeline");
  }, [application?.id]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

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
      toast.success(`Status → ${STATUS_LABELS[status]}`);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const handleEventAdded = (event: EventRecord) => {
    if (!current) return;
    const updated = { ...current, events: [...(current.events ?? []), event] };
    setLocalApp(updated as ApplicationWithRelations);
    onUpdate(updated as ApplicationWithRelations);
  };

  const handleEventUpdated = (event: EventRecord) => {
    if (!current) return;
    const updated = {
      ...current,
      events: (current.events ?? []).map((e) => (e.id === event.id ? event : e)),
    };
    setLocalApp(updated as ApplicationWithRelations);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 40,
          background: "rgba(0,0,0,0.25)",
          backdropFilter: "blur(2px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.2s ease",
        }}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 50,
          width: 560,
          background: "#ffffff",
          boxShadow: "-8px 0 32px rgba(0,0,0,0.12)",
          display: "flex", flexDirection: "column",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
          overflow: "hidden",
        }}
      >
        {!current ? (
          <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 12 }}>
            {[160, 100, 80].map((w, i) => (
              <div key={i} style={{ height: 14, width: w, borderRadius: 4, background: "#F3F4F6", animation: "pulse 1.5s ease-in-out infinite" }} />
            ))}
          </div>
        ) : (
          <>
            {/* ── Header ──────────────────────────────────────────────── */}
            <div style={{
              padding: "20px 24px 16px",
              borderBottom: "1px solid #F3F4F6",
              flexShrink: 0,
            }}>
              {/* Row 1: avatar + role/company + close */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <CompanyAvatar company={current.company} size={56} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111827", lineHeight: 1.2, margin: 0 }}>
                    {current.role}
                  </h2>
                  <p style={{ fontSize: 13, color: "#6B7280", margin: "4px 0 0" }}>
                    {current.company}
                    {(current.salaryMin || current.salaryMax) && (
                      <> · <span style={{ color: "#9CA3AF" }}>{formatSalary(current.salaryMin, current.salaryMax, current.currency)}</span></>
                    )}
                  </p>

                  {/* Row 2: status pill + source + job link */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                    <Select value={current.status} onValueChange={(v) => handleStatusChange(v as AppStatus)} disabled={updating}>
                      <SelectTrigger style={{
                        height: 26, fontSize: 11.5, fontWeight: 600,
                        border: "1px solid #E5E7EB", borderRadius: 20,
                        padding: "0 10px", background: "#F0FDF4", color: "#005F4B",
                        width: "auto", minWidth: 100,
                        display: "flex", alignItems: "center", gap: 4,
                      }}>
                        <SelectValue><StatusBadge status={current.status} size="sm" /></SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_STATUSES.map((s) => (
                          <SelectItem key={s} value={s} className="text-[13px]">
                            <StatusBadge status={s} size="sm" />
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <SourceBadge source={current.source} />

                    {current.jobUrl && (
                      <a
                        href={current.jobUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 11.5, color: "#005F4B", display: "flex", alignItems: "center", gap: 4, textDecoration: "none" }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.textDecoration = "underline")}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.textDecoration = "none")}
                      >
                        <ExternalLink size={12} />
                        View Job ↗
                      </a>
                    )}
                  </div>
                </div>

                {/* Close button */}
                <button
                  onClick={onClose}
                  style={{
                    width: 32, height: 32, borderRadius: 8, border: "none",
                    background: "transparent", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#6B7280", flexShrink: 0, transition: "background 0.12s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#F3F4F6")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Applied date + tags */}
              {(current.appliedAt || (current.tags?.length ?? 0) > 0) && (
                <div style={{ display: "flex", gap: 12, marginTop: 10, fontSize: 11, color: "#9CA3AF" }}>
                  {current.appliedAt && <span>Applied {formatDate(current.appliedAt)}</span>}
                  {(current.tags?.length ?? 0) > 0 && (
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Tag size={10} />
                      {current.tags?.slice(0, 3).join(", ")}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* ── Tabs ────────────────────────────────────────────────── */}
            <div style={{ borderBottom: "1px solid #F3F4F6", display: "flex", padding: "0 24px", flexShrink: 0 }}>
              {TABS.map((tab) => {
                const isActive = activeTab === tab;
                const isAI = tab === "AI Insights";
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      padding: "10px 14px",
                      fontSize: 13,
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? "#111827" : "#6B7280",
                      background: "none",
                      border: "none",
                      borderBottom: isActive ? "2px solid #111827" : "2px solid transparent",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      transition: "color 0.12s, border-color 0.12s",
                      ...(isAI && { color: isActive ? "#005F4B" : "#6B7280" }),
                    }}
                  >
                    {isAI ? "✦ AI Insights" : tab}
                  </button>
                );
              })}
            </div>

            {/* ── Tab Content ─────────────────────────────────────────── */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>

              {/* TIMELINE */}
              {activeTab === "Timeline" && (
                <EventTimeline
                  events={current.events ?? []}
                  applicationId={current.id}
                  onEventAdded={handleEventAdded}
                  onEventUpdated={handleEventUpdated}
                />
              )}

              {/* RECRUITER */}
              {activeTab === "Recruiter" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {current.recruiterName || current.recruiterEmail || current.recruiterLinkedIn ? (
                    <div style={{ border: "1px solid #E5E7EB", borderRadius: 10, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                      {current.recruiterName && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <User size={15} color="#9CA3AF" />
                          <span style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>{current.recruiterName}</span>
                        </div>
                      )}
                      {current.recruiterEmail && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Mail size={15} color="#9CA3AF" />
                          <a href={`mailto:${current.recruiterEmail}`} style={{ fontSize: 13, color: "#005F4B", textDecoration: "none" }}
                            onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.textDecoration = "underline")}
                            onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.textDecoration = "none")}
                          >{current.recruiterEmail}</a>
                        </div>
                      )}
                      {current.recruiterLinkedIn && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Link2 size={15} color="#9CA3AF" />
                          <a href={current.recruiterLinkedIn} target="_blank" rel="noopener noreferrer"
                            style={{ fontSize: 13, color: "#005F4B", textDecoration: "none" }}
                            onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.textDecoration = "underline")}
                            onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.textDecoration = "none")}
                          >LinkedIn Profile</a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", padding: "32px 0", color: "#9CA3AF" }}>
                      <User size={32} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
                      <p style={{ fontSize: 13, margin: 0 }}>No recruiter info</p>
                      <p style={{ fontSize: 11.5, marginTop: 4 }}>Edit application to add recruiter details</p>
                    </div>
                  )}

                  {(current.emails?.length ?? 0) > 0 && (
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Email Threads</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {current.emails?.map((email) => (
                          <div key={email.id} style={{ padding: 12, border: "1px solid #E5E7EB", borderRadius: 8 }}>
                            <p style={{ fontSize: 13, fontWeight: 500, color: "#111827", margin: 0 }}>{email.subject}</p>
                            {email.snippet && <p style={{ fontSize: 11.5, color: "#6B7280", marginTop: 4, lineHeight: 1.5 }}>{email.snippet}</p>}
                            <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 6 }}>
                              {formatDate(email.lastMessageAt)} · {email.messageCount} message{email.messageCount !== 1 ? "s" : ""}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <FollowUpDrafter application={current} />
                </div>
              )}

              {/* NOTES */}
              {activeTab === "Notes" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Notes</label>
                    <NotesEditor value={current.notes || ""} onSave={async (notes) => {
                      const res = await fetch(`/api/applications/${current.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notes }) });
                      const updated = await res.json(); setLocalApp(updated); onUpdate(updated);
                    }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Job Description</label>
                    <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 8 }}>Paste the full JD — used for AI match scoring</p>
                    <NotesEditor value={current.jobDescription || ""} placeholder="Paste full job description here…" rows={8}
                      onSave={async (jd) => {
                        const res = await fetch(`/api/applications/${current.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobDescription: jd }) });
                        const updated = await res.json(); setLocalApp(updated); onUpdate(updated);
                      }} />
                  </div>
                  {(current.statusHistory?.length ?? 0) > 0 && (
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Status History</label>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {current.statusHistory?.slice(0, 6).map((h) => (
                          <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                            <span style={{ color: "#9CA3AF" }}>{formatDate(h.changedAt)}</span>
                            <span style={{ color: "#D1D5DB" }}>→</span>
                            <StatusBadge status={h.toStatus} size="sm" />
                            {h.note && <span style={{ color: "#9CA3AF" }}>· {h.note}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* AI INSIGHTS */}
              {activeTab === "AI Insights" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <MatchScoreCard application={current} onScoreUpdate={(score, notes) => {
                    const updated = { ...current, matchScore: score, aiNotes: notes };
                    setLocalApp(updated as ApplicationWithRelations);
                    onUpdate(updated as ApplicationWithRelations);
                  }} />
                  <PrepQuestionsPanel application={current} />
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.4 } }
      `}</style>
    </>
  );
}

// ── Notes Editor ─────────────────────────────────────────────────────────────

function NotesEditor({
  value, onSave, placeholder = "Add your notes here…", rows = 5,
}: {
  value: string; onSave: (val: string) => void; placeholder?: string; rows?: number;
}) {
  const [text, setText] = useState(value);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setText(value); }, [value]);

  const handleBlur = async () => {
    if (text === value) return;
    setSaving(true);
    await onSave(text);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ position: "relative" }}>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        rows={rows}
        className="text-[13px] resize-none"
      />
      {saving && <span style={{ position: "absolute", bottom: 8, right: 10, fontSize: 10, color: "#9CA3AF" }}>Saving…</span>}
      {saved && <span style={{ position: "absolute", bottom: 8, right: 10, fontSize: 10, color: "#10B981" }}>Saved ✓</span>}
    </div>
  );
}
