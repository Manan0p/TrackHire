"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { Mail, Plus, Check, Loader2, Calendar, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface GmailThread {
  threadId: string;
  subject: string;
  fromEmail: string;
  fromName: string;
  date: string;
  snippet: string;
  isLinked: boolean;
}

export default function InboxPage() {
  const [threads, setThreads] = useState<GmailThread[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInbox = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/integrations/gmail/inbox");
      if (!res.ok) throw new Error("Failed to fetch inbox");
      const data = await res.json();
      setThreads(data.threads || []);
    } catch (err) {
      toast.error("Failed to load Gmail inbox.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchInbox();
  }, []);

  const handleTrack = (thread: GmailThread) => {
    // Attempt to guess Role from Subject
    // e.g. "Software Engineer Interview" -> "Software Engineer"
    let guessedRole = "";
    const roleMatch = thread.subject.match(/(.+?)(?:\s+-\s+|\s+interview|\s+application|\s+offer)/i);
    if (roleMatch && roleMatch[1]) {
      guessedRole = roleMatch[1].trim();
    }

    window.dispatchEvent(
      new CustomEvent("open-add-application", {
        detail: {
          company: thread.fromName,
          role: guessedRole,
          status: "APPLIED"
        },
      })
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#F7F7F4" }}>
      <TopBar title="Inbox" subtitle="Gmail Sync" onSyncSuccess={fetchInbox} />
      
      <div style={{ flex: 1, padding: "20px 24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>Recent Emails</h2>
          <p style={{ fontSize: 13, color: "#6B7280" }}>Fetched {threads.length} job-related emails</p>
        </div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "#6B7280", flexDirection: "column", gap: 12 }}>
            <Loader2 className="animate-spin" size={28} />
            <span style={{ fontSize: 13, fontWeight: 500 }}>Scanning Gmail inbox...</span>
          </div>
        ) : threads.length === 0 ? (
          <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "40px", textAlign: "center" }}>
            <Mail size={40} color="#D1D5DB" style={{ margin: "0 auto 16px" }} />
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#374151", marginBottom: 6 }}>No emails found</h3>
            <p style={{ fontSize: 13, color: "#6B7280" }}>We couldn't find any job-related emails in your recent inbox.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {threads.map((t) => (
              <div
                key={t.threadId}
                style={{
                  background: "#fff",
                  border: "1px solid #E5E7EB",
                  borderRadius: 12,
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 16,
                  boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                  transition: "transform 0.15s, box-shadow 0.15s",
                  cursor: "default"
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Mail size={18} color="#6B7280" />
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {t.fromName}
                      </h4>
                      <span style={{ fontSize: 12, color: "#9CA3AF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        &lt;{t.fromEmail}&gt;
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#9CA3AF", fontSize: 12, flexShrink: 0 }}>
                      <Calendar size={13} />
                      {format(new Date(t.date), "MMM d, h:mm a")}
                    </div>
                  </div>
                  
                  <h5 style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {t.subject}
                  </h5>
                  
                  <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {t.snippet}
                  </p>
                </div>
                
                <div style={{ flexShrink: 0, alignSelf: "center", marginLeft: 8, display: "flex", alignItems: "center", gap: 8 }}>
                  <a
                    href={`https://mail.google.com/mail/u/0/#inbox/${t.threadId}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      background: "#F3F4F6", color: "#374151",
                      padding: "8px 14px", borderRadius: 8,
                      fontSize: 12, fontWeight: 600,
                      border: "none", cursor: "pointer", textDecoration: "none",
                      transition: "background 0.15s"
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = "#E5E7EB"}
                    onMouseOut={(e) => e.currentTarget.style.background = "#F3F4F6"}
                  >
                    <ExternalLink size={14} /> View
                  </a>
                  {t.isLinked ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#005F4B", fontSize: 12, fontWeight: 600, padding: "8px 12px", background: "#E6F4EA", borderRadius: 8 }}>
                      <Check size={14} /> Tracked
                    </div>
                  ) : (
                    <button
                      onClick={() => handleTrack(t)}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        background: "#111827", color: "#fff",
                        padding: "8px 14px", borderRadius: 8,
                        fontSize: 12, fontWeight: 600,
                        border: "none", cursor: "pointer",
                        transition: "background 0.15s"
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = "#374151"}
                      onMouseOut={(e) => e.currentTarget.style.background = "#111827"}
                    >
                      <Plus size={14} /> Add App
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
