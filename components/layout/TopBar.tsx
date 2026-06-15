"use client";

import { useState } from "react";
import { Bell, Plus, Loader2 } from "lucide-react";
import { UserAvatar } from "@/components/layout/UserAvatar";
import { toast } from "sonner";
import { signIn } from "next-auth/react";

interface TopBarProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  showGmailSync?: boolean;
  showAddApplication?: boolean;
  showBell?: boolean;
  onSyncSuccess?: (data?: any) => void;
}

export function TopBar({
  title,
  subtitle,
  children,
  showGmailSync = true,
  showAddApplication = true,
  showBell = true,
  onSyncSuccess,
}: TopBarProps) {
  const [syncing, setSyncing] = useState(false);

  const openAddDialog = () => {
    window.dispatchEvent(
      new CustomEvent("open-add-application", { detail: { status: "APPLIED" } })
    );
  };

  const handleGmailSync = async () => {
    setSyncing(true);
    const toastId = toast.loading("Syncing Gmail inbox...");
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
              onClick: () => signIn("google", { callbackUrl: window.location.pathname }),
            },
            duration: 10000,
          });
        } else {
          toast.error(data.error || "Gmail sync failed", { id: toastId });
        }
        return;
      }
      toast.success(`Synced ${data.synced} threads — found ${data.detected.length} job-related emails`, { id: toastId });
      if (onSyncSuccess) onSyncSuccess(data);
    } catch {
      toast.error("Gmail sync failed", { id: toastId });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        height: "56px",
        background: "#ffffff",
        borderBottom: "1px solid #E5E7EB",
        flexShrink: 0,
        position: "sticky",
        top: 0,
        zIndex: 10,
        gap: "16px",
      }}
    >
      {/* Title block */}
      <div style={{ flexShrink: 0 }}>
        {subtitle && (
          <p
            style={{
              fontSize: "10px",
              fontWeight: 600,
              color: "#9CA3AF",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              margin: "0 0 2px 0",
              lineHeight: 1.2,
            }}
          >
            {subtitle}
          </p>
        )}
        <h1
          style={{
            fontSize: "16px",
            fontWeight: 700,
            color: "#111827",
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          {title}
        </h1>
      </div>

      {/* Page-specific children (e.g. Search, Navigation) */}
      {children && (
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {children}
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* Right Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {/* Sync Gmail */}
        {showGmailSync && (
          <button
            onClick={handleGmailSync}
            disabled={syncing}
            style={{
              height: 34,
              padding: "0 14px",
              border: "1px solid #D1D5DB",
              borderRadius: "8px",
              background: "#ffffff",
              fontSize: "12.5px",
              fontWeight: 500,
              color: "#374151",
              cursor: syncing ? "not-allowed" : "pointer",
              transition: "background 0.15s",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
            onMouseEnter={(e) => {
              if (!syncing) e.currentTarget.style.background = "#F9FAFB";
            }}
            onMouseLeave={(e) => {
              if (!syncing) e.currentTarget.style.background = "#ffffff";
            }}
          >
            {syncing && (
              <Loader2
                size={13}
                style={{ animation: "spin 1s linear infinite" }}
              />
            )}
            Sync Gmail
          </button>
        )}

        {/* Add Application */}
        {showAddApplication && (
          <button
            onClick={openAddDialog}
            style={{
              height: 34,
              padding: "0 14px",
              border: "none",
              borderRadius: "8px",
              background: "#005F4B",
              fontSize: "12.5px",
              fontWeight: 600,
              color: "#ffffff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#004A3A")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#005F4B")}
          >
            <Plus size={14} strokeWidth={2.5} />
            Add Application
          </button>
        )}

        {/* Bell */}
        {showBell && (
          <button
            title="Notifications"
            style={{
              width: 34,
              height: 34,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "8px",
              color: "#6B7280",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#F3F4F6")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <Bell size={16} strokeWidth={1.8} />
          </button>
        )}

        <UserAvatar size={32} />
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </header>
  );
}
