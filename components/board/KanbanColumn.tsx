"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { ApplicationCard } from "./ApplicationCard";
import { AppStatus } from "@prisma/client";
import { STATUS_LABELS, STATUS_COLORS } from "@/types";
import type { ApplicationWithRelations } from "@/types";

interface KanbanColumnProps {
  status: AppStatus;
  applications: ApplicationWithRelations[];
  onCardClick: (app: ApplicationWithRelations) => void;
  onAddApplication: (status: AppStatus) => void;
  onEditApplication: (app: ApplicationWithRelations) => void;
  onArchiveApplication: (app: ApplicationWithRelations) => void;
}

export function KanbanColumn({
  status,
  applications,
  onCardClick,
  onAddApplication,
  onEditApplication,
  onArchiveApplication,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const color = STATUS_COLORS[status];
  const compactLabel = status === "OA" ? "OA" : STATUS_LABELS[status];

  return (
    <div className="w-[242px] flex flex-col h-full shrink-0">
      {/* Header */}
      <div
        className="flex items-center justify-between mb-1.5 border-t-2 pt-1.5"
        style={{ borderTopColor: color }}
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[13px] text-[var(--foreground)] uppercase tracking-[0.08em]">
            {compactLabel}
          </span>
          <span className="bg-[var(--surface-container-high)] text-[var(--text-muted)] font-bold text-[10px] px-1.5 py-0.5 rounded-full leading-none">
            {applications.length}
          </span>
        </div>
        <button
          onClick={() => onAddApplication(status)}
          className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors p-0.5 rounded hover:bg-[var(--surface-container-high)]"
          title={`Add ${STATUS_LABELS[status]} application`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Column Body / Drop Zone */}
      <div
        ref={setNodeRef}
        className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-2 rounded-md transition-colors duration-200"
        style={{
          ...(isOver && {
            outline: `1px solid ${color}35`,
            backgroundColor: `${color}08`,
          }),
        }}
      >
        <SortableContext
          items={applications.map((a) => a.id)}
          strategy={verticalListSortingStrategy}
        >
          {applications.map((app) => (
            <ApplicationCard
              key={app.id}
              application={app}
              onClick={() => onCardClick(app)}
              onEdit={() => onEditApplication(app)}
              onAddEvent={() => onCardClick(app)}
              onArchive={() => onArchiveApplication(app)}
            />
          ))}
        </SortableContext>

        {applications.length === 0 && (
          <div className="flex-1 border-2 border-dashed border-[var(--border)]/55 rounded-md flex flex-col items-center justify-center">
            <button
              onClick={() => onAddApplication(status)}
              className="flex flex-col items-center gap-2 text-[var(--text-subtle)] hover:text-[var(--primary)] transition-colors group"
            >
              <div className="w-9 h-9 rounded-full bg-[var(--surface-container-high)] flex items-center justify-center group-hover:bg-[var(--primary-light)]">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-[12px] font-medium">Drop or Add</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
