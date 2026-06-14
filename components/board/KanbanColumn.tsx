"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { ApplicationCard } from "./ApplicationCard";
import { AppStatus } from "@prisma/client";
import { STATUS_LABELS } from "@/types";
import type { ApplicationWithRelations } from "@/types";

const COLUMN_LABELS: Partial<Record<AppStatus, string>> = {
  WISHLIST: "WISHLIST",
  APPLIED: "APPLIED",
  OA: "OA",
  PHONE: "PHONE SCREEN",
  TECHNICAL: "TECHNICAL",
  FINAL: "FINAL ROUND",
  OFFER: "OFFER",
};

// Spec-defined status border colors
const COLUMN_COLORS: Partial<Record<AppStatus, string>> = {
  WISHLIST:  "#3B82F6",  // blue
  APPLIED:   "#10B981",  // teal/green
  OA:        "#F59E0B",  // amber
  PHONE:     "#F97316",  // orange
  TECHNICAL: "#8B5CF6",  // purple
  FINAL:     "#F43F5E",  // pink/red
  OFFER:     "#14B8A6",  // teal
};

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
  const color = COLUMN_COLORS[status] ?? "#9CA3AF";
  const label = COLUMN_LABELS[status] ?? STATUS_LABELS[status].toUpperCase();

  return (
    <div style={{ width: 240, display: "flex", flexDirection: "column", height: "100%", flexShrink: 0 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "8px",
          borderTop: `2px solid ${color}`,
          paddingTop: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "#374151",
              letterSpacing: "0.07em",
            }}
          >
            {label}
          </span>
          <span
            style={{
              background: "#F3F4F6",
              color: "#6B7280",
              fontSize: "10px",
              fontWeight: 700,
              padding: "1px 6px",
              borderRadius: "10px",
              lineHeight: "16px",
            }}
          >
            {applications.length}
          </span>
        </div>
        <button
          onClick={() => onAddApplication(status)}
          title={`Add ${STATUS_LABELS[status]} application`}
          style={{
            width: 22,
            height: 22,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 5,
            color: "#9CA3AF",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#F3F4F6"; e.currentTarget.style.color = "#005F4B"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#9CA3AF"; }}
        >
          <Plus size={14} strokeWidth={2.2} />
        </button>
      </div>

      {/* Column Body / Drop Zone */}
      <div
        ref={setNodeRef}
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          borderRadius: 8,
          transition: "all 0.15s",
          padding: "2px",
          ...(isOver && {
            outline: `1.5px solid ${color}50`,
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
          <div
            style={{
              flex: 1,
              minHeight: 100,
              border: "2px dashed #D1D5DB",
              borderRadius: 8,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <button
              onClick={() => onAddApplication(status)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#9CA3AF",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#005F4B")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#9CA3AF")}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: "#F3F4F6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.15s",
                }}
              >
                <Plus size={16} />
              </div>
              <span style={{ fontSize: "11.5px", fontWeight: 500 }}>Drop or Add</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
