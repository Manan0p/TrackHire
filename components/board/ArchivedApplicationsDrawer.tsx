"use client";

import { useEffect, useRef, useState } from "react";
import { X, RotateCcw, Trash2, Archive } from "lucide-react";
import type { ApplicationWithRelations } from "@/types";
import { formatDate } from "@/lib/utils";

interface ArchivedApplicationsDrawerProps {
  open: boolean;
  onClose: () => void;
  applications: ApplicationWithRelations[];
  onRestore: (app: ApplicationWithRelations) => void;
  onDelete: (app: ApplicationWithRelations) => void;
}

const AVATAR_COLORS: [string, string][] = [
  ["#1E3A5F", "#3B82F6"], ["#1C3A2B", "#10B981"], ["#3B1F2B", "#F43F5E"],
  ["#2D1B4E", "#8B5CF6"], ["#3B2A0E", "#F59E0B"], ["#1A3040", "#0EA5E9"],
];

function CompanyAvatar({ company, size = 40 }: { company: string; size?: number }) {
  const idx = company.charCodeAt(0) % AVATAR_COLORS.length;
  const [bg, text] = AVATAR_COLORS[idx];
  return (
    <div style={{
      width: size, height: size, borderRadius: 8, background: bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, fontWeight: 700, color: text,
      fontSize: Math.round(size * 0.38), letterSpacing: "-0.01em",
    }}>
      {company.slice(0, 2).toUpperCase()}
    </div>
  );
}

export function ArchivedApplicationsDrawer({
  open,
  onClose,
  applications,
  onRestore,
  onDelete,
}: ArchivedApplicationsDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key press
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 40,
          background: "rgba(0, 0, 0, 0.25)",
          backdropFilter: "blur(2px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.22s ease-in-out",
        }}
      />

      {/* Drawer Container */}
      <div
        ref={drawerRef}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 50,
          width: "500px",
          maxWidth: "100%",
          background: "#ffffff",
          boxShadow: "-8px 0 32px rgba(0, 0, 0, 0.08)",
          display: "flex",
          flexDirection: "column",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #F3F4F6",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>
                Archived Applications
              </h2>
              <span
                style={{
                  background: "#F3F4F6",
                  color: "#4B5563",
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 12,
                }}
              >
                {applications.length}
              </span>
            </div>
            <p style={{ fontSize: 12.5, color: "#6B7280", margin: "4px 0 0" }}>
              Manage your rejected, ghosted, or withdrawn applications.
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#6B7280",
              transition: "background 0.12s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#F3F4F6")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          {applications.length === 0 ? (
            <div
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "#9CA3AF",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: "50%",
                  background: "#F9FAFB",
                  border: "1px dashed #D1D5DB",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#9CA3AF",
                }}
              >
                <Archive size={22} strokeWidth={1.5} />
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 13.5, fontWeight: 600, color: "#4B5563", margin: 0 }}>
                  No archived applications
                </p>
                <p style={{ fontSize: 12, color: "#9CA3AF", margin: "4px 0 0" }}>
                  Drag applications to the archive option to move them here.
                </p>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {applications.map((app) => {
                const isRejected = app.status === "REJECTED";
                const isGhosted = app.status === "GHOSTED";
                const statusColor = isRejected
                  ? { bg: "#FEE2E2", text: "#EF4444" }
                  : isGhosted
                  ? { bg: "#FEF3C7", text: "#D97706" }
                  : { bg: "#F3F4F6", text: "#4B5563" };

                return (
                  <div
                    key={app.id}
                    style={{
                      border: "1px solid #E5E7EB",
                      borderRadius: 10,
                      padding: 16,
                      background: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      transition: "box-shadow 0.15s, border-color 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#D1D5DB";
                      e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.03)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#E5E7EB";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <CompanyAvatar company={app.company} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                        <h4 style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {app.company}
                        </h4>
                        <span style={{ fontSize: 12, color: "#6B7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {app.role}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: statusColor.bg,
                            color: statusColor.text,
                          }}
                        >
                          {app.status === "REJECTED" ? "Rejected" : app.status === "GHOSTED" ? "Ghosted" : "Withdrawn"}
                        </span>
                        {app.appliedAt && (
                          <span style={{ fontSize: 11, color: "#9CA3AF" }}>
                            Applied {formatDate(app.appliedAt)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      {/* Restore Button */}
                      <button
                        onClick={() => onRestore(app)}
                        style={{
                          height: 30,
                          padding: "0 10px",
                          background: "#ECFDF5",
                          border: "1px solid #A7F3D0",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#059669",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          transition: "background 0.12s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#D1FAE5")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "#ECFDF5")}
                      >
                        <RotateCcw size={13} />
                        Restore
                      </button>

                      {/* Delete permanently */}
                      <button
                        onClick={() => onDelete(app)}
                        title="Delete Permanently"
                        style={{
                          height: 30,
                          width: 30,
                          background: "#FEF2F2",
                          border: "1px solid #FCA5A5",
                          borderRadius: 6,
                          color: "#DC2626",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "background 0.12s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#FEE2E2")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "#FEF2F2")}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
