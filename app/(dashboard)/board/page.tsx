"use client";

import { useCallback, useEffect, useState } from "react";
import { AppStatus } from "@prisma/client";
import {
  Plus,
  Bell,
  Search,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { ApplicationDetail } from "@/components/applications/ApplicationDetail";
import { ApplicationForm } from "@/components/applications/ApplicationForm";
import { KanbanBoard } from "@/components/board/KanbanBoard";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApplicationWithRelations } from "@/types";

export default function BoardPage() {
  const [applications, setApplications] = useState<ApplicationWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<ApplicationWithRelations | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState<AppStatus>("APPLIED");
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
    const timer = window.setTimeout(() => {
      void fetchApplications();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchApplications]);

  const handleCardClick = (app: ApplicationWithRelations) => {
    setSelectedApp(app);
    setDetailOpen(true);
  };

  const handleAddApplication = (status: AppStatus) => {
    setDefaultStatus(status);
    setAddOpen(true);
  };

  const handleApplicationAdded = (app: ApplicationWithRelations) => {
    setApplications((prev) => [app, ...prev]);
    setAddOpen(false);
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
    <div className="flex h-full flex-col bg-[var(--background)]">
      {/* Top Bar — matches Stitch design: single unified header */}
      <header className="flex items-center px-6 h-14 bg-white border-b border-[var(--border)] shrink-0 z-10 w-full sticky top-0 gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-0 max-w-[338px]">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
          <Input
            placeholder="Search applications..."
            className="w-full pl-9 pr-3 bg-[var(--surface-container-low)] border border-[var(--border)] rounded-md text-[12px] h-8 focus-visible:ring-1 focus-visible:ring-[var(--primary)]/30"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-container-low)] rounded-md"
            title="Notifications"
          >
            <Bell className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 bg-white text-[12px] hover:bg-slate-50 border-[var(--border)] text-[var(--foreground)] px-2.5"
            onClick={handleGmailSync}
          >
            Sync Gmail
          </Button>
          <Button
            size="sm"
            className="h-8 gap-1.5 bg-[var(--primary)] px-3 text-[12px] text-white hover:bg-[var(--primary-dark)] font-semibold shadow-sm"
            onClick={() => handleAddApplication("APPLIED")}
          >
            <Plus className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
            Add Application
          </Button>

          <button
            className="h-8 w-8 rounded-full border border-[var(--border)] bg-[var(--surface-container-low)] text-[var(--text-muted)] flex items-center justify-center hover:bg-[var(--surface-container-high)] transition-colors"
            title="Account"
          >
            <User className="h-4 w-4" />
          </button>
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
          onAddApplication={handleAddApplication}
          onEditApplication={handleCardClick}
        />
      )}

      <ApplicationDetail
        application={selectedApp}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onUpdate={handleApplicationUpdated}
      />

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">Add Application</DialogTitle>
          </DialogHeader>
          <ApplicationForm
            defaultStatus={defaultStatus}
            onSuccess={handleApplicationAdded}
            onCancel={() => setAddOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <CommandPalette
        onAddApplication={() => handleAddApplication("APPLIED")}
        onGmailSync={() => toast.info("Gmail sync coming soon - connect in Settings")}
      />
    </div>
  );
}
