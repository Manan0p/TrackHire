"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import {
  User, Mail, FileText, Download, Trash2,
  Loader2, CheckCircle2, RefreshCw, Calendar, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { getInitials, formatRelative } from "@/lib/utils";
import { GOOGLE_SCOPES } from "@/lib/auth";

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  resumeText: string | null;
  gmailConnected: boolean;
  calendarId: string | null;
  gmailLastSyncedAt?: string | null;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [resumeText, setResumeText] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((data) => {
        setProfile(data);
        setName(data.name || "");
        setResumeText(data.resumeText || "");
      })
      .catch(() => toast.error("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, resumeText }),
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
    setSyncing(true);
    try {
      const res = await fetch("/api/integrations/gmail/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          toast.error(data.error || "Please re-authenticate with Google");
        } else if (res.status === 429) {
          toast.error(data.error);
        } else {
          toast.error("Gmail sync failed");
        }
        return;
      }
      const { detected, synced } = data;
      toast.success(`Synced ${synced} threads — found ${detected.length} job-related emails`);
      setProfile((p) => p ? { ...p, gmailConnected: true } : p);
    } catch {
      toast.error("Gmail sync failed");
    } finally {
      setSyncing(false);
    }
  };

  // Re-authenticate with Google to grant Calendar access
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

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-6 py-3 h-14 border-b border-[var(--border)] bg-white sticky top-0 z-10">
          <div>
            <h1 className="text-[16px] font-bold text-[var(--foreground)] leading-none">Settings</h1>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Manage your profile and preferences</p>
          </div>
        </div>
        <div className="flex-1 overflow-auto px-6 py-6">
          <div className="max-w-2xl mx-auto space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 h-14 border-b border-[var(--border)] bg-white sticky top-0 z-10 gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-subtle)] mb-0.5">Account</p>
          <h1 className="text-[16px] font-bold text-[var(--foreground)] leading-none">Settings</h1>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 py-6">
        <div className="max-w-2xl mx-auto space-y-8">

          {/* ── Profile ───────────────────────────────────────────────────── */}
          <section>
            <h2 className="text-[14px] font-semibold mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-[var(--primary)]" />
              Profile
            </h2>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={profile?.image || undefined} />
                  <AvatarFallback className="bg-[var(--primary-light)] text-[var(--primary)] font-semibold">
                    {getInitials(profile?.name || profile?.email || "U")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-[14px] font-medium">{profile?.name || "No name"}</p>
                  <p className="text-[12px] text-[var(--text-muted)]">{profile?.email}</p>
                </div>
              </div>
              <div>
                <Label className="text-[13px] mb-1.5 block">Display Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9 text-[13px]" placeholder="Your full name" />
              </div>
              <Button onClick={handleSaveProfile} disabled={saving} className="h-9 text-[13px] bg-[var(--primary)] hover:bg-[var(--primary-dark)]">
                {saving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : null}
                Save Profile
              </Button>
            </div>
          </section>

          {/* ── Resume ────────────────────────────────────────────────────── */}
          <section>
            <h2 className="text-[14px] font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[var(--primary)]" />
              Resume
            </h2>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 space-y-3">
              <p className="text-[12px] text-[var(--text-muted)]">
                Paste your resume text below. The AI uses this to compute match scores for each job description.
              </p>
              <Textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your full resume text here…"
                className="min-h-[200px] text-[13px] resize-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[var(--text-subtle)]">{resumeText.length} characters</span>
                <Button onClick={handleSaveProfile} size="sm" disabled={saving} className="h-8 text-[12px] bg-[var(--primary)] hover:bg-[var(--primary-dark)]">
                  {saving ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
                  Save Resume
                </Button>
              </div>
            </div>
          </section>

          {/* ── Integrations ──────────────────────────────────────────────── */}
          <section>
            <h2 className="text-[14px] font-semibold mb-4 flex items-center gap-2">
              <Mail className="w-4 h-4 text-[var(--primary)]" />
              Integrations
            </h2>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 space-y-4">

              {/* Gmail */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-medium">Gmail</p>
                    {profile?.gmailConnected && (
                      <span className="text-[11px] text-green-600 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3 h-3" /> Connected
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
                    Syncs job-related emails from your inbox using your Google account OAuth token.
                    No third-party service involved.
                  </p>
                  {profile?.gmailLastSyncedAt && (
                    <p className="text-[11px] text-[var(--text-subtle)] mt-1">
                      Last synced {formatRelative(profile.gmailLastSyncedAt)}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant={profile?.gmailConnected ? "outline" : "default"}
                  className="h-8 text-[12px] gap-1.5 flex-shrink-0"
                  onClick={handleGmailSync}
                  disabled={syncing}
                >
                  {syncing
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <RefreshCw className="w-3.5 h-3.5" />}
                  {profile?.gmailConnected ? "Sync Now" : "Connect & Sync"}
                </Button>
              </div>

              <Separator />

              {/* Google Calendar */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-medium">Google Calendar</p>
                    {profile?.gmailConnected ? (
                      <span className="text-[11px] text-green-600 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3 h-3" /> Access Granted
                      </span>
                    ) : (
                      <span className="text-[11px] text-amber-600 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3 h-3" /> Needs permission
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
                    Automatically creates and updates Google Calendar events when you add interviews.
                    Uses your existing Google sign-in — no extra accounts needed.
                  </p>
                </div>
                {!profile?.gmailConnected && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-[12px] gap-1.5 flex-shrink-0"
                    onClick={handleGrantCalendarAccess}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    Grant Access
                  </Button>
                )}
              </div>
            </div>
          </section>

          {/* ── Data ──────────────────────────────────────────────────────── */}
          <section>
            <h2 className="text-[14px] font-semibold mb-4 flex items-center gap-2">
              <Download className="w-4 h-4 text-[var(--primary)]" />
              Data
            </h2>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-medium">Export All Data</p>
                  <p className="text-[12px] text-[var(--text-muted)]">Download all your applications as JSON</p>
                </div>
                <Button size="sm" variant="outline" className="h-8 text-[12px] gap-1.5" onClick={handleExportData}>
                  <Download className="w-3.5 h-3.5" />
                  Export
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-medium text-red-600">Delete Account</p>
                  <p className="text-[12px] text-[var(--text-muted)]">Permanently delete your account and all data</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-[12px] text-red-600 border-red-200 hover:bg-red-50 gap-1.5"
                  onClick={() => toast.error("Account deletion requires email confirmation — contact support")}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </Button>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
