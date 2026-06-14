"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { Archive, Edit2, Plus } from "lucide-react";
import { CompanyLogo } from "@/components/applications/CompanyLogo";
import { SourceBadge } from "@/components/applications/SourceBadge";
import { cn, daysSince } from "@/lib/utils";
import type { ApplicationWithRelations } from "@/types";

interface ApplicationCardProps {
  application: ApplicationWithRelations;
  onClick: () => void;
  onEdit?: () => void;
  onAddEvent?: () => void;
  onArchive?: () => void;
}

export function ApplicationCard({
  application,
  onClick,
  onEdit,
  onAddEvent,
  onArchive,
}: ApplicationCardProps) {
  const [showActions, setShowActions] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: application.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const days = daysSince(application.appliedAt || application.createdAt);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-[var(--surface-container-lowest)] border border-[#cbd3ce] rounded-md p-2.5 shadow-[0_1px_1px_rgba(0,0,0,0.03)] hover:border-[#aab8b1] hover:shadow-sm transition-all cursor-pointer group relative flex flex-col gap-1.5",
        isDragging && "opacity-50 cursor-grabbing"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      {/* Top row: Logo + Company + Source */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2 min-w-0">
          <CompanyLogo company={application.company} size={20} />
          <span className="font-semibold text-[12.5px] text-[var(--foreground)] truncate max-w-[122px]">
            {application.company}
          </span>
        </div>
        <SourceBadge source={application.source} size="sm" />
      </div>

      {/* Role Title */}
      <div className="text-[11px] text-[var(--text-muted)] truncate">
        {application.role}
      </div>

      {/* Bottom row: Time + Match Score */}
      <div className="flex justify-between items-center mt-auto pt-1">
        <div className="text-[10.5px] text-[var(--text-subtle)] font-medium">
          Added {days === 0 ? "today" : `${days}d ago`}
        </div>

        {application.matchScore !== null && application.matchScore !== undefined && (
          <div className="bg-[var(--primary-container)] text-[var(--on-primary-container)] font-bold text-[9.5px] px-1.5 py-0.5 rounded">
            {application.matchScore}% Match
          </div>
        )}
      </div>

      {/* Hover action bar */}
      {showActions && (
        <div
          className="animate-scale-in absolute right-1.5 top-1.5 flex gap-1 bg-[var(--surface-container-lowest)] border border-[var(--border)] rounded-md p-0.5 shadow-md"
          onClick={(e) => e.stopPropagation()}
        >
          {onEdit && (
            <button
              className="flex h-6 w-6 items-center justify-center rounded text-[var(--text-muted)] hover:bg-[var(--primary-light)] hover:text-[var(--primary)] transition-colors"
              onClick={onEdit}
              title="Edit"
            >
              <Edit2 className="h-3 w-3" />
            </button>
          )}
          {onAddEvent && (
            <button
              className="flex h-6 w-6 items-center justify-center rounded text-[var(--text-muted)] hover:bg-[var(--primary-light)] hover:text-[var(--primary)] transition-colors"
              onClick={onAddEvent}
              title="Add event"
            >
              <Plus className="h-3 w-3" />
            </button>
          )}
          {onArchive && (
            <button
              className="flex h-6 w-6 items-center justify-center rounded text-[var(--text-muted)] hover:bg-red-50 hover:text-red-500 transition-colors"
              onClick={onArchive}
              title="Archive"
            >
              <Archive className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
