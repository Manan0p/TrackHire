"use client";

import { useCallback, useEffect, useState } from "react";
import { AppStatus } from "@prisma/client";
import { Search } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
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



  return (
    <div className="flex h-full flex-col" style={{ background: "#F7F7F4" }}>
      <TopBar title="Board" subtitle="Applications" onSyncSuccess={fetchApplications}>
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
      </TopBar>

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
          onApplicationsChange={setApplications}
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
