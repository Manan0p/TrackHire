"use client";

import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragOverlay,
} from "@dnd-kit/core";
import { ChevronUp, ChevronRight } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { KanbanColumn } from "./KanbanColumn";
import { ApplicationCard } from "./ApplicationCard";
import { ArchivedApplicationsDrawer } from "./ArchivedApplicationsDrawer";
import { KANBAN_COLUMNS, ARCHIVED_COLUMNS } from "@/types";
import type { ApplicationWithRelations } from "@/types";
import { AppStatus } from "@prisma/client";

interface KanbanBoardProps {
  initialApplications: ApplicationWithRelations[];
  onCardClick: (app: ApplicationWithRelations) => void;
  onAddApplication: (status: AppStatus) => void;
  onEditApplication: (app: ApplicationWithRelations) => void;
  onApplicationsChange?: (apps: ApplicationWithRelations[]) => void;
}

export function KanbanBoard({
  initialApplications,
  onCardClick,
  onAddApplication,
  onEditApplication,
  onApplicationsChange,
}: KanbanBoardProps) {
  const [applications, setApplications] = useState(initialApplications);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const getColumnApps = useCallback((status: AppStatus) =>
    applications
      .filter((a) => a.status === status)
      .sort((a, b) => a.boardOrder - b.boardOrder), [applications]);

  const activeApp = activeId ? applications.find((a) => a.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over) return;

      const activeApp = applications.find((a) => a.id === active.id);
      if (!activeApp) return;

      // Dropped on a column (the droppable area)
      const targetStatus = over.id as AppStatus;
      const isColumn = KANBAN_COLUMNS.includes(targetStatus) || ARCHIVED_COLUMNS.includes(targetStatus);

      let newStatus = activeApp.status;
      let newOrder = activeApp.boardOrder;

      if (isColumn) {
        newStatus = targetStatus;
        newOrder = getColumnApps(targetStatus).length;
      } else {
        // Dropped on another card — reorder within/across columns
        const overApp = applications.find((a) => a.id === over.id);
        if (!overApp) return;
        newStatus = overApp.status;
        newOrder = overApp.boardOrder;
      }

      if (newStatus === activeApp.status && newOrder === activeApp.boardOrder) return;

      // Optimistic UI update
      const updatedApps = applications.map((a) =>
        a.id === activeApp.id ? { ...a, status: newStatus, boardOrder: newOrder } : a
      );
      setApplications(updatedApps);
      onApplicationsChange?.(updatedApps);

      try {
        await fetch(`/api/applications/${activeApp.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus, boardOrder: newOrder }),
        });
      } catch {
        // Rollback on error
        setApplications(initialApplications);
        onApplicationsChange?.(initialApplications);
        toast.error("Failed to update application status");
      }
    },
    [applications, getColumnApps, initialApplications, onApplicationsChange]
  );

  const handleArchive = useCallback(
    async (app: ApplicationWithRelations) => {
      const updatedApps = applications.map((a) => (a.id === app.id ? { ...a, status: "WITHDRAWN" as AppStatus } : a));
      setApplications(updatedApps);
      onApplicationsChange?.(updatedApps);
      try {
        await fetch(`/api/applications/${app.id}`, { method: "DELETE" });
        toast.success(`Archived ${app.company} application`);
      } catch {
        setApplications(initialApplications);
        onApplicationsChange?.(initialApplications);
        toast.error("Failed to archive application");
      }
    },
    [applications, initialApplications, onApplicationsChange]
  );

  const handleRestore = useCallback(
    async (app: ApplicationWithRelations) => {
      const updatedApps = applications.map((a) =>
        a.id === app.id ? { ...a, status: "APPLIED" as AppStatus } : a
      );
      setApplications(updatedApps);
      onApplicationsChange?.(updatedApps);
      try {
        await fetch(`/api/applications/${app.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "APPLIED" }),
        });
        toast.success(`Restored ${app.company} to Applied column`);
      } catch {
        setApplications(initialApplications);
        onApplicationsChange?.(initialApplications);
        toast.error("Failed to restore application");
      }
    },
    [applications, initialApplications, onApplicationsChange]
  );

  const handleDeletePermanent = useCallback(
    async (app: ApplicationWithRelations) => {
      if (!window.confirm(`Are you sure you want to permanently delete your application to ${app.company}? This cannot be undone.`)) {
        return;
      }
      const updatedApps = applications.filter((a) => a.id !== app.id);
      setApplications(updatedApps);
      onApplicationsChange?.(updatedApps);
      try {
        await fetch(`/api/applications/${app.id}?permanent=true`, { method: "DELETE" });
        toast.success(`Permanently deleted ${app.company} application`);
      } catch {
        setApplications(initialApplications);
        onApplicationsChange?.(initialApplications);
        toast.error("Failed to delete application");
      }
    },
    [applications, initialApplications, onApplicationsChange]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full flex-col">
        <div className="kanban-board pt-3">
          {KANBAN_COLUMNS.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              applications={getColumnApps(status)}
              onCardClick={onCardClick}
              onAddApplication={onAddApplication}
              onEditApplication={onEditApplication}
              onArchiveApplication={handleArchive}
            />
          ))}
        </div>

        <div
          onClick={() => setDrawerOpen(true)}
          style={{
            margin: "4px 8px 6px",
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderRadius: 6,
            border: "1px solid #E5E7EB",
            background: "#F9FAFB",
            padding: "0 12px",
            flexShrink: 0,
            cursor: "pointer",
            userSelect: "none",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#F3F4F6")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#F9FAFB")}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#6B7280" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a1 1 0 00-1 1v1a1 1 0 001 1h16a1 1 0 001-1V8a1 1 0 00-1-1zM5 10v8a2 2 0 002 2h10a2 2 0 002-2v-8" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 14h4" />
            </svg>
            <span style={{ fontSize: 11.5, fontWeight: 500, color: "#6B7280" }}>
              Archived Applications (Rejected / Withdrawn)
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                background: "#E5E7EB",
                color: "#374151",
                fontSize: 10.5,
                fontWeight: 700,
                padding: "1px 7px",
                borderRadius: 10,
                lineHeight: "16px",
              }}
            >
              {ARCHIVED_COLUMNS.reduce((sum, status) => sum + getColumnApps(status).length, 0)}
            </span>
            <ChevronRight style={{ width: 13, height: 13, color: "#6B7280" }} />
          </div>
        </div>
      </div>

      <ArchivedApplicationsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        applications={applications.filter((a) => ARCHIVED_COLUMNS.includes(a.status))}
        onRestore={handleRestore}
        onDelete={handleDeletePermanent}
      />

      <DragOverlay>
        {activeApp && (
          <div style={{ opacity: 0.9 }}>
            <ApplicationCard
              application={activeApp}
              onClick={() => {}}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
