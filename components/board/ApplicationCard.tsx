"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { Archive, Edit2, Plus } from "lucide-react";
import { CompanyLogo } from "@/components/applications/CompanyLogo";
import { cn, daysSince } from "@/lib/utils";
import type { ApplicationWithRelations } from "@/types";

const SOURCE_BADGE: Record<string, { bg: string; color: string; border: string; label: string }> = {
  LINKEDIN:      { bg: "#EFF6FF", color: "#2563EB", border: "#BFDBFE", label: "LinkedIn" },
  WELLFOUND:     { bg: "#FFF7ED", color: "#EA580C", border: "#FED7AA", label: "Wellfound" },
  EMAIL:         { bg: "#F0FDF4", color: "#16A34A", border: "#BBF7D0", label: "Email" },
  COMPANY_PORTAL:{ bg: "#F5F5F4", color: "#57534E", border: "#D6D3D1", label: "Careers" },
  REFERRAL:      { bg: "#FFF7ED", color: "#C2410C", border: "#FED7AA", label: "Referral" },
  OTHER:         { bg: "#F5F5F4", color: "#57534E", border: "#D6D3D1", label: "Direct" },
};

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
  const src = SOURCE_BADGE[application.source] || SOURCE_BADGE.OTHER;
  const isOld = days > 14;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && "opacity-50 cursor-grabbing")}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #E4E7EC",
          borderRadius: 8,
          padding: "10px 11px",
          cursor: "pointer",
          transition: "border-color 0.15s, box-shadow 0.15s",
          position: "relative",
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          display: "flex",
          flexDirection: "column",
          gap: 5,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "#C8D0DC";
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 6px rgba(0,0,0,0.08)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "#E4E7EC";
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 2px rgba(0,0,0,0.04)";
        }}
      >
        {/* Top row: Logo + Company name + Source badge */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0, flex: 1 }}>
            <CompanyLogo company={application.company} size={20} />
            <span
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: "#111827",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: 120,
              }}
            >
              {application.company}
            </span>
          </div>
          {/* Source badge */}
          <span
            style={{
              display: "inline-block",
              padding: "2px 7px",
              borderRadius: 5,
              fontSize: 10,
              fontWeight: 500,
              background: src.bg,
              color: src.color,
              border: `1px solid ${src.border}`,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {src.label}
          </span>
        </div>

        {/* Role */}
        <div
          style={{
            fontSize: 11.5,
            color: "#6B7280",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {application.role}
        </div>

        {/* Bottom row: time + match */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span
              style={{
                width: 6, height: 6, borderRadius: "50%",
                background: isOld ? "#EF4444" : "#10B981",
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 10.5, color: "#9CA3AF", fontWeight: 500 }}>
              {days === 0 ? "Today" : `${days}d ago`}
            </span>
          </div>

          {application.matchScore !== null && application.matchScore !== undefined && (
            <span
              style={{
                display: "inline-block",
                padding: "2px 7px",
                borderRadius: 5,
                fontSize: 10,
                fontWeight: 700,
                background: "#005F4B",
                color: "#ffffff",
              }}
            >
              {application.matchScore}% Match
            </span>
          )}
        </div>

        {/* Hover action bar */}
        {showActions && (
          <div
            style={{
              position: "absolute",
              right: 6,
              top: 6,
              display: "flex",
              gap: 3,
              background: "#ffffff",
              border: "1px solid #E4E7EC",
              borderRadius: 6,
              padding: "2px 3px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {onEdit && (
              <button
                style={{
                  width: 22, height: 22, border: "none", background: "transparent",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: 4, color: "#6B7280", transition: "all 0.1s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#EFF6FF"; e.currentTarget.style.color = "#2563EB"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6B7280"; }}
                onClick={onEdit}
                title="Edit"
              >
                <Edit2 size={11} />
              </button>
            )}
            {onAddEvent && (
              <button
                style={{
                  width: 22, height: 22, border: "none", background: "transparent",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: 4, color: "#6B7280", transition: "all 0.1s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#F0FDF4"; e.currentTarget.style.color = "#16A34A"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6B7280"; }}
                onClick={onAddEvent}
                title="Add event"
              >
                <Plus size={11} />
              </button>
            )}
            {onArchive && (
              <button
                style={{
                  width: 22, height: 22, border: "none", background: "transparent",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: 4, color: "#6B7280", transition: "all 0.1s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#FEF2F2"; e.currentTarget.style.color = "#EF4444"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6B7280"; }}
                onClick={onArchive}
                title="Archive"
              >
                <Archive size={11} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
