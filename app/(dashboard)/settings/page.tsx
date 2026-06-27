"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import {
  User, Mail, Download, Trash2,
  Loader2, CheckCircle2, RefreshCw, Calendar, AlertCircle, Key
} from "lucide-react";
import { toast } from "sonner";
import { getInitials, formatRelative } from "@/lib/utils";
import { GOOGLE_SCOPES } from "@/types";
import { TopBar } from "@/components/layout/TopBar";

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  resumeText: string | null;
  gmailConnected: boolean;
  calendarId: string | null;
  gmailLastSyncedAt?: string | null;
  apiKey?: string | null;
}

// ─── Reusable styled primitives ───────────────────────────────────────────────

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: "#ffffff",
      border: "1px solid #E5E7EB",
      borderRadius: 10,
      padding: "24px",
      display: "flex",
      flexDirection: "column",
      gap: 20,
    }}>
      {children}
    </div>
  );
}

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 4, borderBottom: "1px solid #F3F4F6" }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: "#F0F9F6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={16} color="#005F4B" />
      </div>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: 0 }}>{title}</h2>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
      {children}
    </label>
  );
}

function StyledInput({ value, onChange, placeholder, disabled }: {
  value: string; onChange: (v: string) => void; placeholder?: string; disabled?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: "100%", height: 40, padding: "0 12px",
        border: `1px solid ${focused ? "#005F4B" : "#D1D5DB"}`,
        borderRadius: 6, fontSize: 13, color: "#111827",
        background: disabled ? "#F9FAFB" : "#fff",
        outline: "none", boxSizing: "border-box",
        boxShadow: focused ? "0 0 0 3px rgba(0,95,75,0.08)" : "none",
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}
    />
  );
}

function TealButton({
  onClick, disabled, loading, children, size = "md",
}: {
  onClick: () => void; disabled?: boolean; loading?: boolean;
  children: React.ReactNode; size?: "sm" | "md";
}) {
  const [hovered, setHovered] = useState(false);
  const h = size === "sm" ? 34 : 40;
  const px = size === "sm" ? 16 : 20;
  const fs = size === "sm" ? 12.5 : 13;
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        height: h, padding: `0 ${px}px`,
        background: (disabled || loading) ? "#9CA3AF" : hovered ? "#004A3A" : "#005F4B",
        color: "#fff", border: "none", borderRadius: 6,
        fontSize: fs, fontWeight: 600,
        cursor: (disabled || loading) ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", gap: 6,
        flexShrink: 0, whiteSpace: "nowrap",
        transition: "background 0.15s",
      }}
    >
      {loading && <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />}
      {children}
    </button>
  );
}

function OutlineButton({
  onClick, disabled, loading, children, danger = false, size = "sm",
}: {
  onClick: () => void; disabled?: boolean; loading?: boolean;
  children: React.ReactNode; danger?: boolean; size?: "sm" | "md";
}) {
  const [hovered, setHovered] = useState(false);
  const borderColor = danger ? "#DC2626" : "#D1D5DB";
  const textColor = danger ? "#DC2626" : "#374151";
  const hoverBg = danger ? "#DC2626" : "#F9FAFB";
  const hoverText = danger ? "#fff" : "#111827";
  const h = size === "sm" ? 34 : 40;

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        height: h, padding: "0 16px",
        background: hovered ? hoverBg : "#fff",
        color: hovered ? hoverText : textColor,
        border: `1px solid ${borderColor}`,
        borderRadius: 6, fontSize: 12.5, fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", gap: 6,
        flexShrink: 0, whiteSpace: "nowrap",
        transition: "all 0.15s",
      }}
    >
      {loading && <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />}
      {children}
    </button>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "#F3F4F6", margin: "4px 0" }} />;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((data) => {
        setProfile(data);
        setName(data.name || "");
      })
      .catch(() => toast.error("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  const handleGenerateKey = async () => {
    setGeneratingKey(true);
    try {
      const res = await fetch("/api/user/apikey", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error();
      setProfile((p) => p ? { ...p, apiKey: data.apiKey } : p);
      toast.success("New API Key generated!");
    } catch {
      toast.error("Failed to generate API Key");
    } finally {
      setGeneratingKey(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error();
      toast.success("Profile saved!");
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleGmailSync = async () => {
    if (!profile?.gmailConnected) {
      signIn("google", { callbackUrl: "/settings" }, { scope: GOOGLE_SCOPES });
      return;
    }
    setSyncing(true);
    const toastId = toast.loading("Syncing Gmail...");
    try {
      const res = await fetch("/api/integrations/gmail/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Google Connection Expired", {
            id: toastId,
            description: data.error || "Please reconnect your Google account.",
            action: {
              label: "Reconnect",
              onClick: () => signIn("google", { callbackUrl: "/settings" }, { scope: GOOGLE_SCOPES }),
            },
            duration: 10000,
          });
        } else {
          toast.error(data.error || "Gmail sync failed", { id: toastId });
        }
        return;
      }
      const { detected, synced } = data;
      toast.success(`Synced ${synced} threads — found ${detected.length} job-related emails`, { id: toastId });
      setProfile((p) => p ? { ...p, gmailConnected: true } : p);
    } catch {
      toast.error("Gmail sync failed", { id: toastId });
    } finally {
      setSyncing(false);
    }
  };

  const handleGrantCalendarAccess = () => {
    signIn("google", { callbackUrl: "/settings" }, { scope: GOOGLE_SCOPES });
  };

  const handleExportData = async () => {
    try {
      const res = await fetch("/api/applications?limit=1000");
      const data = await res.json();
      const json = JSON.stringify(data.applications, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "trackhire-export.json";
      a.click();
      toast.success("Data exported!");
    } catch {
      toast.error("Failed to export data");
    }
  };

  const initials = getInitials(profile?.name || profile?.email || "U");

  // ─── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <TopBar title="Settings" subtitle="Account" showGmailSync={false} showAddApplication={false} />
        <div style={{ flex: 1, overflowY: "auto", padding: "32px 40px" }}>
          <div style={{ maxWidth: 700, display: "flex", flexDirection: "column", gap: 16 }}>
            {[120, 200, 160, 120].map((h, i) => (
              <div key={i} style={{ height: h, background: "#F3F4F6", borderRadius: 10, animation: "pulse 1.5s ease-in-out infinite" }} />
            ))}
          </div>
        </div>
        <style>{`@keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.5 } } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ─── Main render ───────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#F7F7F4" }}>
      <TopBar title="Settings" subtitle="Account" showGmailSync={false} showAddApplication={false} />

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "32px 40px" }}>
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 16 }}>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "start" }}>
            
            {/* Left Column - Profile & Info */}
            <div style={{ flex: "1 1 340px", display: "flex", flexDirection: "column", gap: 16 }}>
              {/* ── Profile Card ─────────────────────────────────────────────── */}
              <SectionCard>
                <SectionHeader icon={User} title="Profile" />

                {/* Avatar + name row */}
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  {/* Avatar circle */}
                  <div style={{
                    width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
                    background: profile?.image && !imageError ? "transparent" : "#005F4B",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    overflow: "hidden", border: "2px solid #E5E7EB",
                  }}>
                    {profile?.image && !imageError ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profile.image} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={() => setImageError(true)} />
                    ) : (
                      <span style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>{initials}</span>
                    )}
                  </div>
                  <div>
                    <p style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: 0 }}>
                      {profile?.name || "No name set"}
                    </p>
                    <p style={{ fontSize: 13, color: "#6B7280", margin: "2px 0 0" }}>
                      {profile?.email}
                    </p>
                  </div>
                </div>

                {/* Display name field */}
                <div>
                  <FieldLabel>Display Name</FieldLabel>
                  <StyledInput
                    value={name}
                    onChange={setName}
                    placeholder="Your full name"
                  />
                </div>

                {/* Save button — right-aligned */}
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <TealButton onClick={handleSaveProfile} loading={saving}>
                    {saving ? "Saving…" : "Save Profile"}
                  </TealButton>
                </div>
              </SectionCard>

              {/* ── Data Card ─────────────────────────────────────────────────── */}
              <SectionCard>
                <SectionHeader icon={Download} title="Data" />

                {/* Export row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>Export All Data</p>
                    <p style={{ fontSize: 13, color: "#6B7280", margin: "2px 0 0" }}>
                      Download all your applications as a JSON file
                    </p>
                  </div>
                  <OutlineButton onClick={handleExportData}>
                    <Download size={13} />
                    Export
                  </OutlineButton>
                </div>

                <Divider />

                {/* Delete Account row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#DC2626", margin: 0 }}>Delete Account</p>
                    <p style={{ fontSize: 13, color: "#6B7280", margin: "2px 0 0" }}>
                      Permanently delete your account and all associated data
                    </p>
                  </div>
                  <OutlineButton
                    onClick={() => toast.error("Account deletion requires email confirmation — contact support")}
                    danger
                  >
                    <Trash2 size={13} />
                    Delete
                  </OutlineButton>
                </div>
              </SectionCard>
            </div>

            {/* Right Column - Integrations & Data */}
            <div style={{ flex: "1 1 340px", display: "flex", flexDirection: "column", gap: 16 }}>
              {/* ── Integrations Card ─────────────────────────────────────── */}
              <SectionCard>
                <SectionHeader icon={Mail} title="Integrations" />

                {/* Gmail row */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>Gmail</p>
                      {profile?.gmailConnected && (
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          fontSize: 11, fontWeight: 500, color: "#059669",
                          background: "#ECFDF5", border: "1px solid #A7F3D0",
                          padding: "2px 8px", borderRadius: 20,
                        }}>
                          <CheckCircle2 size={10} />
                          Connected
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 13, color: "#6B7280", margin: 0, lineHeight: 1.5 }}>
                      Syncs job-related emails from your inbox using your Google account OAuth token. No third-party service involved.
                    </p>
                    {profile?.gmailLastSyncedAt && (
                      <p style={{ fontSize: 11.5, color: "#9CA3AF", margin: "4px 0 0" }}>
                        Last synced {formatRelative(profile.gmailLastSyncedAt)}
                      </p>
                    )}
                  </div>
                  <OutlineButton onClick={handleGmailSync} loading={syncing}>
                    {syncing ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <RefreshCw size={13} />}
                    {profile?.gmailConnected ? "Sync Now" : "Connect & Sync"}
                  </OutlineButton>
                </div>

                <Divider />

                {/* Google Calendar row */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>Google Calendar</p>
                      {profile?.gmailConnected ? (
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          fontSize: 11, fontWeight: 500, color: "#059669",
                          background: "#ECFDF5", border: "1px solid #A7F3D0",
                          padding: "2px 8px", borderRadius: 20,
                        }}>
                          <CheckCircle2 size={10} />
                          Access Granted
                        </span>
                      ) : (
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          fontSize: 11, fontWeight: 500, color: "#D97706",
                          background: "#FEF3C7", border: "1px solid #FDE68A",
                          padding: "2px 8px", borderRadius: 20,
                        }}>
                          <AlertCircle size={10} />
                          Needs permission
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 13, color: "#6B7280", margin: 0, lineHeight: 1.5 }}>
                      Automatically creates and updates Google Calendar events when you add interviews. Uses your existing Google sign-in — no extra accounts needed.
                    </p>
                  </div>
                  {!profile?.gmailConnected && (
                    <OutlineButton onClick={handleGrantCalendarAccess}>
                      <Calendar size={13} />
                      Grant Access
                    </OutlineButton>
                  )}
                </div>
              </SectionCard>

              {/* ── Developer Card ─────────────────────────────────────────────────── */}
              <SectionCard>
                <SectionHeader icon={Key} title="Developer / API" />

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>API Key</p>
                    <p style={{ fontSize: 13, color: "#6B7280", margin: "2px 0 12px" }}>
                      Use this key to authenticate with the TrackHire Chrome Extension or custom API integrations.
                    </p>
                    
                    {profile?.apiKey ? (
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <div style={{ 
                          flex: 1, 
                          padding: "10px 14px", 
                          background: "#F9FAFB", 
                          border: "1px solid #E5E7EB", 
                          borderRadius: 8,
                          fontSize: 13,
                          fontFamily: "monospace",
                          color: "#374151",
                          overflowX: "auto"
                        }}>
                          {profile.apiKey}
                        </div>
                        <OutlineButton onClick={() => {
                          navigator.clipboard.writeText(profile.apiKey || "");
                          toast.success("Copied to clipboard!");
                        }}>
                          Copy
                        </OutlineButton>
                      </div>
                    ) : (
                      <p style={{ fontSize: 13, color: "#9CA3AF", fontStyle: "italic", margin: 0 }}>
                        No API Key generated yet.
                      </p>
                    )}
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                    <OutlineButton onClick={handleGenerateKey} loading={generatingKey}>
                      {generatingKey ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <RefreshCw size={13} />}
                      {profile?.apiKey ? "Regenerate Key" : "Generate API Key"}
                    </OutlineButton>
                  </div>
                </div>
              </SectionCard>
            </div>

          </div>

        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.5 } }
      `}</style>
    </div>
  );
}
