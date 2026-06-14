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
import { ChevronUp } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { KanbanColumn } from "./KanbanColumn";
import { ApplicationCard } from "./ApplicationCard";
import { KANBAN_COLUMNS, ARCHIVED_COLUMNS } from "@/types";
import type { ApplicationWithRelations } from "@/types";
import { AppStatus } from "@prisma/client";

interface KanbanBoardProps {
  initialApplications: ApplicationWithRelations[];
  onCardClick: (app: ApplicationWithRelations) => void;
  onAddApplication: (status: AppStatus) => void;
  onEditApplication: (app: ApplicationWithRelations) => void;
}

export function KanbanBoard({
  initialApplications,
  onCardClick,
  onAddApplication,
  onEditApplication,
}: KanbanBoardProps) {
  const [applications, setApplications] = useState(initialApplications);
  const [activeId, setActiveId] = useState<string | null>(null);

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
      setApplications((prev) =>
        prev.map((a) =>
          a.id === activeApp.id ? { ...a, status: newStatus, boardOrder: newOrder } : a
        )
      );

      try {
        await fetch(`/api/applications/${activeApp.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus, boardOrder: newOrder }),
        });
      } catch {
        // Rollback on error
        setApplications(initialApplications);
        toast.error("Failed to update application status");
      }
    },
    [applications, getColumnApps, initialApplications]
  );

  const handleArchive = useCallback(
    async (app: ApplicationWithRelations) => {
      setApplications((prev) =>
        prev.map((a) => (a.id === app.id ? { ...a, status: "WITHDRAWN" } : a))
      );
      try {
        await fetch(`/api/applications/${app.id}`, { method: "DELETE" });
        toast.success(`Archived ${app.company} application`);
      } catch {
        setApplications(initialApplications);
        toast.error("Failed to archive application");
      }
    },
    [initialApplications]
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

        <div className="mx-2 mb-2 flex h-7 items-center justify-between rounded-sm border border-[var(--border)] bg-white px-2">
          <span className="text-[11px] font-medium text-[var(--text-muted)]">
            Archived Applications (Rejected / Withdrawn)
          </span>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--text-subtle)]">
            <span className="inline-flex min-w-4 items-center justify-center rounded-full bg-[var(--surface-container-high)] px-1 text-[10px] leading-4 text-[var(--text-muted)]">
              {ARCHIVED_COLUMNS.reduce((sum, status) => sum + getColumnApps(status).length, 0)}
            </span>
            <ChevronUp className="h-3 w-3" />
          </div>
        </div>
      </div>

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
