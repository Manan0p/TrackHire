"use client";

import { useState, useEffect, useRef } from "react";
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
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    if (isNotificationsOpen) {
      document.addEventListener("mousedown", handler);
    }
    return () => document.removeEventListener("mousedown", handler);
  }, [isNotificationsOpen]);

  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch {
      // Fail silently for background alerts
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    if (showBell) {
      void fetchNotifications();
    }
  }, [showBell]);

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
          <div ref={notificationsRef} style={{ position: "relative", flexShrink: 0 }}>
            <button
              onClick={() => {
                const nextState = !isNotificationsOpen;
                setIsNotificationsOpen(nextState);
                if (nextState) {
                  void fetchNotifications();
                }
              }}
              title="Notifications"
              style={{
                width: 34,
                height: 34,
                border: "none",
                background: isNotificationsOpen ? "#F3F4F6" : "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "8px",
                color: "#6B7280",
                transition: "background 0.15s, box-shadow 0.15s",
                position: "relative",
                boxShadow: isNotificationsOpen ? "0 0 0 3px rgba(0,95,75,0.15)" : "none",
              }}
              onMouseEnter={(e) => {
                if (!isNotificationsOpen) e.currentTarget.style.background = "#F3F4F6";
              }}
              onMouseLeave={(e) => {
                if (!isNotificationsOpen) e.currentTarget.style.background = "transparent";
              }}
            >
              <Bell size={16} strokeWidth={1.8} />
              {notifications.length > 0 && (
                <span style={{
                  position: "absolute",
                  top: 6,
                  right: 6,
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#EF4444",
                }} />
              )}
            </button>

            {isNotificationsOpen && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: 40,
                  zIndex: 100,
                  background: "#fff",
                  border: "1px solid #E5E7EB",
                  borderRadius: 10,
                  padding: "4px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)",
                  width: "360px",
                  animation: "fadeIn 0.1s ease-out",
                }}
              >
                {/* Header */}
                <div style={{ padding: "10px 12px 10px", borderBottom: "1px solid #F3F4F6" }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#111827" }}>Notifications</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "#6B7280" }}>
                    Real-time updates on your applications, interviews, and deadlines.
                  </p>
                </div>

                {/* Content */}
                <div style={{
                  maxHeight: "320px",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  padding: "6px 4px 4px",
                }}>
                  {loadingNotifications ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}>
                      <Loader2 size={20} style={{ animation: "spin 1s linear infinite", color: "#005F4B" }} />
                    </div>
                  ) : notifications.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "32px 0", color: "#6B7280" }}>
                      <p style={{ margin: 0, fontSize: "13px", fontWeight: 600 }}>All caught up! 🎉</p>
                      <p style={{ margin: "4px 0 0", fontSize: "11.5px", color: "#9CA3AF" }}>No upcoming deadlines or interview alerts.</p>
                    </div>
                  ) : (
                    notifications.map((n) => {
                      const iconColor = n.type === "alert" ? "#EF4444" : n.type === "warning" ? "#D97706" : "#2563EB";
                      const iconBg = n.type === "alert" ? "#FEF2F2" : n.type === "warning" ? "#FFFBEB" : "#EFF6FF";
                      const iconSymbol = n.type === "alert" ? "🚨" : n.type === "warning" ? "⚠️" : "📅";
                      return (
                        <a
                          key={n.id}
                          href={n.link || "/board"}
                          onClick={() => setIsNotificationsOpen(false)}
                          style={{
                            textDecoration: "none",
                            color: "inherit",
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "12px",
                            padding: "10px 12px",
                            borderRadius: "8px",
                            background: "transparent",
                            transition: "background 0.12s",
                            cursor: "pointer",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#F9FAFB";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                          }}
                        >
                          <div style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "6px",
                            background: iconBg,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            fontSize: "14px",
                            color: iconColor,
                          }}>
                            {iconSymbol}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px" }}>
                              <p style={{ margin: 0, fontSize: "12.5px", fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {n.title}
                              </p>
                              <span style={{ fontSize: "10px", color: "#9CA3AF", fontWeight: 500, flexShrink: 0 }}>
                                {n.company}
                              </span>
                            </div>
                            <p style={{ margin: "3px 0 0", fontSize: "11px", color: "#4B5563", lineHeight: 1.4 }}>
                              {n.description}
                            </p>
                          </div>
                        </a>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <UserAvatar size={32} />
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </header>
  );
}

