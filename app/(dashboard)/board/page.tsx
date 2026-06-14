"use client";

import { useCallback, useEffect, useState } from "react";
import { AppStatus } from "@prisma/client";
import { Plus, Bell, Search } from "lucide-react";
import { UserAvatar } from "@/components/layout/UserAvatar";
import { toast } from "sonner";
import { ApplicationDetail } from "@/components/applications/ApplicationDetail";
import { KanbanBoard } from "@/components/board/KanbanBoard";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApplicationWithRelations } from "@/types";

/** Dispatch the shared global Add Application dialog with a given status */
function openAddDialog(status: AppStatus = "APPLIED") {
  window.dispatchEvent(
    new CustomEvent("open-add-application", { detail: { status } })
  );
}

export default function BoardPage() {
  const [applications, setApplications] = useState<ApplicationWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<ApplicationWithRelations | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [search, setSearch] = useState("");

  const fetchApplications = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: "200" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/applications?${params}`);
      const data = await res.json();
      setApplications(data.applications || []);
    } catch {
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchApplications(), 0);
    return () => window.clearTimeout(timer);
  }, [fetchApplications]);

  // Listen for apps added via the global dialog
  useEffect(() => {
    const handleAdded = (e: Event) => {
      const app = (e as CustomEvent<{ app: ApplicationWithRelations }>).detail?.app;
      if (app) setApplications((prev) => [app, ...prev]);
    };
    window.addEventListener("application-added", handleAdded);
    return () => window.removeEventListener("application-added", handleAdded);
  }, []);

  const handleCardClick = (app: ApplicationWithRelations) => {
    setSelectedApp(app);
    setDetailOpen(true);
  };

  const handleApplicationUpdated = (updated: ApplicationWithRelations) => {
    setApplications((prev) =>
      prev.map((a) => (a.id === updated.id ? updated : a))
    );
    setSelectedApp(updated);
  };

  const handleGmailSync = async () => {
    toast.promise(
      fetch("/api/integrations/gmail/sync", { method: "POST" }).then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Sync failed");
        }
        return res.json();
      }),
      {
        loading: "Syncing Gmail inbox...",
        success: (data) => {
          void fetchApplications();
          return `Synced ${data.synced} threads — found ${data.detected.length} job-related emails`;
        },
        error: (err: Error) => err.message || "Gmail sync failed",
      }
    );
  };

  return (
    <div className="flex h-full flex-col" style={{ background: "#F7F7F4" }}>
      {/* Top Bar */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          height: "52px",
          background: "#ffffff",
          borderBottom: "1px solid #E5E7EB",
          flexShrink: 0,
          position: "sticky",
          top: 0,
          zIndex: 10,
          gap: "10px",
        }}
      >
        {/* Search */}
        <div style={{ position: "relative", width: "300px", flexShrink: 0 }}>
          <Search
            style={{
              position: "absolute",
              left: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              width: 14,
              height: 14,
              color: "#9CA3AF",
            }}
          />
          <input
            placeholder="Search applications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              height: "34px",
              paddingLeft: "32px",
              paddingRight: "12px",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              fontSize: "12.5px",
              color: "#374151",
              background: "#F9FAFB",
              outline: "none",
              boxSizing: "border-box",
            }}
            onFocus={(e) => { e.target.style.borderColor = "#005F4B"; e.target.style.background = "#fff"; }}
            onBlur={(e) => { e.target.style.borderColor = "#E5E7EB"; e.target.style.background = "#F9FAFB"; }}
          />
        </div>

        <div style={{ flex: 1 }} />

        {/* Right Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Bell */}
          <button
            title="Notifications"
            style={{
              width: 34, height: 34, border: "none", background: "transparent",
              cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", borderRadius: "8px", color: "#6B7280",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#F3F4F6")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <Bell size={17} strokeWidth={1.8} />
          </button>

          {/* Sync Gmail */}
          <button
            onClick={handleGmailSync}
            style={{
              height: 34, padding: "0 14px", border: "1px solid #D1D5DB",
              borderRadius: "8px", background: "#ffffff", fontSize: "12.5px",
              fontWeight: 500, color: "#374151", cursor: "pointer", transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
          >
            Sync Gmail
          </button>

          {/* Add Application — uses global dialog */}
          <button
            onClick={() => openAddDialog("APPLIED")}
            style={{
              height: 34, padding: "0 14px", border: "none", borderRadius: "8px",
              background: "#005F4B", fontSize: "12.5px", fontWeight: 600,
              color: "#ffffff", cursor: "pointer", display: "flex",
              alignItems: "center", gap: "5px", transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#004A3A")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#005F4B")}
          >
            <Plus size={14} strokeWidth={2.5} />
            Add Application
          </button>

          <UserAvatar size={32} />
        </div>
      </header>

      {loading ? (
        <div className="kanban-board pt-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="kanban-column">
              <div className="kanban-column-header">
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="kanban-column-body space-y-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} className="h-28 w-full rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <KanbanBoard
          key={`${search}:${applications.map((a) => `${a.id}:${a.status}:${a.boardOrder}`).join("|")}`}
          initialApplications={applications}
          onCardClick={handleCardClick}
          onAddApplication={openAddDialog}
          onEditApplication={handleCardClick}
        />
      )}

      <ApplicationDetail
        application={selectedApp}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onUpdate={handleApplicationUpdated}
      />

      <CommandPalette
        onAddApplication={() => openAddDialog("APPLIED")}
        onGmailSync={() => toast.info("Gmail sync coming soon - connect in Settings")}
      />
    </div>
  );
}
