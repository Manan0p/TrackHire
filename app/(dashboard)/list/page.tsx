"use client";

import { useState, useEffect, useCallback } from "react";
import { ApplicationDetail } from "@/components/applications/ApplicationDetail";
import { CompanyLogo } from "@/components/applications/CompanyLogo";
import { Download, Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { formatDate, daysSince } from "@/lib/utils";
import { EVENT_TYPE_LABELS } from "@/types";
import { toast } from "sonner";
import type { ApplicationWithRelations } from "@/types";
import { AppStatus } from "@prisma/client";

const SOURCE_COLORS: Record<string, { bg: string; color: string; border: string; label: string }> = {
  LINKEDIN:      { bg: "#EFF6FF", color: "#2563EB", border: "#BFDBFE", label: "LinkedIn" },
  WELLFOUND:     { bg: "#FFF7ED", color: "#EA580C", border: "#FED7AA", label: "Wellfound" },
  EMAIL:         { bg: "#F0FDF4", color: "#16A34A", border: "#BBF7D0", label: "Email" },
  COMPANY_PORTAL:{ bg: "#F5F5F4", color: "#57534E", border: "#D6D3D1", label: "Direct" },
  REFERRAL:      { bg: "#FFF7ED", color: "#C2410C", border: "#FED7AA", label: "Referral" },
  OTHER:         { bg: "#F5F5F4", color: "#57534E", border: "#D6D3D1", label: "Other" },
};

const STATUS_DISPLAY: Record<string, { dot: string; label: string }> = {
  WISHLIST:  { dot: "#9CA3AF", label: "Wishlist" },
  APPLIED:   { dot: "#3B82F6", label: "Applied" },
  OA:        { dot: "#8B5CF6", label: "OA" },
  PHONE:     { dot: "#0EA5E9", label: "Screening" },
  TECHNICAL: { dot: "#F59E0B", label: "Interviewing" },
  FINAL:     { dot: "#EF4444", label: "Final Round" },
  OFFER:     { dot: "#10B981", label: "Offer" },
  REJECTED:  { dot: "#F43F5E", label: "Rejected" },
};

const PAGE_SIZE = 10;

type SortKey = "company" | "role" | "appliedAt" | "matchScore" | "days";
type SortDir = "asc" | "desc";

export default function ListView() {
  const [applications, setApplications] = useState<ApplicationWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All Active");
  const [sortKey, setSortKey] = useState<SortKey>("appliedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [selectedApp, setSelectedApp] = useState<ApplicationWithRelations | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchApplications = useCallback(async () => {
    try {
      const res = await fetch("/api/applications?limit=200");
      const data = await res.json();
      setApplications(data.applications || []);
    } catch {
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);



  const handleExportCSV = () => {
    const headers = ["Company", "Role", "Source", "Status", "Applied At", "Match Score"];
    const rows = filtered.map((r) => [
      r.company, r.role, r.source, r.status,
      r.appliedAt ? formatDate(r.appliedAt) : "",
      r.matchScore ?? "",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "trackhire-applications.csv"; a.click();
    toast.success("Exported CSV");
  };

  // Filter
  const ACTIVE_STATUSES: AppStatus[] = ["WISHLIST", "APPLIED", "OA", "PHONE", "TECHNICAL", "FINAL", "OFFER"];
  const filtered = applications
    .filter((a) => {
      const q = search.toLowerCase();
      const matchSearch = !q || a.company.toLowerCase().includes(q) || a.role.toLowerCase().includes(q);
      const matchSource = sourceFilter === "All" || a.source === sourceFilter;
      const matchStatus =
        statusFilter === "All Active" ? ACTIVE_STATUSES.includes(a.status) :
        statusFilter === "All" ? true :
        a.status === statusFilter;
      return matchSearch && matchSource && matchStatus;
    })
    .sort((a, b) => {
      let av: string | number | null = null, bv: string | number | null = null;
      if (sortKey === "company") { av = a.company; bv = b.company; }
      else if (sortKey === "role") { av = a.role; bv = b.role; }
      else if (sortKey === "appliedAt") { av = a.appliedAt ? new Date(a.appliedAt).getTime() : 0; bv = b.appliedAt ? new Date(b.appliedAt).getTime() : 0; }
      else if (sortKey === "matchScore") { av = a.matchScore ?? -1; bv = b.matchScore ?? -1; }
      else if (sortKey === "days") { av = daysSince(a.appliedAt || a.createdAt); bv = daysSince(b.appliedAt || b.createdAt); }
      if (av === null || bv === null) return 0;
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
    setPage(1);
  };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? (
      sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />
    ) : (
      <span style={{ opacity: 0.3, display: "inline-flex" }}><ChevronUp size={12} /></span>
    );

  const sources = ["All", ...Object.keys(SOURCE_COLORS)];
  const statuses = ["All Active", "All", ...Object.keys(STATUS_DISPLAY)];

  const inputStyle: React.CSSProperties = {
    height: "34px",
    border: "1px solid #E5E7EB",
    borderRadius: "8px",
    fontSize: "12.5px",
    color: "#374151",
    background: "#ffffff",
    outline: "none",
    cursor: "pointer",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#F7F7F4" }}>
      <TopBar title="List" subtitle="Applications" onSyncSuccess={fetchApplications} />

      {/* Content */}
      <div style={{ flex: 1, padding: "20px 24px", overflow: "auto" }}>
        {/* Filter Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "16px",
            flexWrap: "wrap",
          }}
        >
          {/* Search */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <Search
              style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 13, height: 13, color: "#9CA3AF" }}
            />
            <input
              placeholder="Search companies, roles..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{
                ...inputStyle,
                paddingLeft: "30px",
                paddingRight: "12px",
                width: "220px",
              }}
            />
          </div>

          {/* Source Dropdown */}
          <select
            value={sourceFilter}
            onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
            style={{ ...inputStyle, padding: "0 10px", paddingRight: "28px", appearance: "auto" }}
          >
            {sources.map((s) => (
              <option key={s} value={s}>{s === "All" ? "Source: All" : (SOURCE_COLORS[s]?.label ?? s)}</option>
            ))}
          </select>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ ...inputStyle, padding: "0 10px", paddingRight: "28px", appearance: "auto" }}
          >
            {statuses.map((s) => (
              <option key={s} value={s}>{s === "All Active" ? "Status: All Active" : s === "All" ? "Status: All" : (STATUS_DISPLAY[s]?.label ?? s)}</option>
            ))}
          </select>

          {/* Date Range placeholder */}
          <button
            style={{ ...inputStyle, padding: "0 14px", display: "flex", alignItems: "center", gap: "6px", fontWeight: 400, color: "#9CA3AF" }}
          >
            📅 Date Range
          </button>

          <div style={{ flex: 1 }} />

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            style={{
              ...inputStyle,
              padding: "0 14px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontWeight: 500,
              color: "#374151",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
          >
            <Download size={13} />
            Export CSV
          </button>
        </div>

        {/* Table */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #E5E7EB",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#9CA3AF", fontSize: 14 }}>
              Loading applications...
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
                <thead>
                  <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                    <th style={{ width: 40, padding: "10px 16px" }}>
                      <input type="checkbox" style={{ cursor: "pointer" }} />
                    </th>
                    {(
                      [
                        { label: "COMPANY", key: "company" as SortKey },
                        { label: "ROLE", key: "role" as SortKey },
                        { label: "SOURCE", key: null },
                        { label: "STATUS", key: null },
                        { label: "APPLIED", key: "appliedAt" as SortKey },
                        { label: "LAST ACTIVITY", key: "days" as SortKey },
                        { label: "NEXT EVENT", key: null },
                        { label: "MATCH", key: "matchScore" as SortKey },
                        { label: "ACTION", key: null },
                      ] as { label: string; key: SortKey | null }[]
                    ).map(({ label, key }) => (
                      <th
                        key={label}
                        style={{
                          padding: "10px 14px",
                          textAlign: "left",
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "#6B7280",
                          letterSpacing: "0.07em",
                          cursor: key ? "pointer" : "default",
                          userSelect: "none",
                          whiteSpace: "nowrap",
                        }}
                        onClick={() => key && handleSort(key)}
                      >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          {label}
                          {key && <SortIcon k={key} />}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ padding: "40px", textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>
                        No applications found
                      </td>
                    </tr>
                  ) : (
                    paginated.map((app, i) => {
                      const srcInfo = SOURCE_COLORS[app.source] || SOURCE_COLORS.OTHER;
                      const stInfo = STATUS_DISPLAY[app.status] || { dot: "#9CA3AF", label: app.status };
                      const days = daysSince(app.appliedAt || app.createdAt);
                      const lastActivity = days === 0 ? "Today" : days === 1 ? "1 day ago" : `${days} days ago`;
                      const evt = app.events?.[0];
                      const match = app.matchScore;

                      return (
                        <tr
                          key={app.id}
                          style={{
                            borderBottom: i < paginated.length - 1 ? "1px solid #F3F4F6" : "none",
                            cursor: "pointer",
                            transition: "background 0.1s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          onClick={() => { setSelectedApp(app); setDetailOpen(true); }}
                        >
                          {/* Checkbox */}
                          <td style={{ padding: "12px 16px" }} onClick={(e) => e.stopPropagation()}>
                            <input type="checkbox" style={{ cursor: "pointer" }} />
                          </td>

                          {/* Company */}
                          <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <CompanyLogo company={app.company} size={26} />
                              <span style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>{app.company}</span>
                            </div>
                          </td>

                          {/* Role */}
                          <td style={{ padding: "12px 14px", maxWidth: 160 }}>
                            <span style={{ fontSize: 13, color: "#374151", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{app.role}</span>
                          </td>

                          {/* Source Badge */}
                          <td style={{ padding: "12px 14px" }}>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "3px 9px",
                                borderRadius: "6px",
                                fontSize: "11.5px",
                                fontWeight: 500,
                                background: srcInfo.bg,
                                color: srcInfo.color,
                                border: `1px solid ${srcInfo.border}`,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {srcInfo.label}
                            </span>
                          </td>

                          {/* Status dot + label */}
                          <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span
                                style={{
                                  width: 7, height: 7, borderRadius: "50%",
                                  background: stInfo.dot, flexShrink: 0,
                                }}
                              />
                              <span style={{ fontSize: 13, color: "#374151" }}>{stInfo.label}</span>
                            </div>
                          </td>

                          {/* Applied */}
                          <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                            <span style={{ fontSize: 12.5, color: "#6B7280" }}>
                              {app.appliedAt ? formatDate(app.appliedAt) : "—"}
                            </span>
                          </td>

                          {/* Last Activity */}
                          <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                            <span style={{ fontSize: 12.5, color: days > 14 ? "#EF4444" : days > 7 ? "#F59E0B" : "#6B7280" }}>
                              {lastActivity}
                            </span>
                          </td>

                          {/* Next Event */}
                          <td style={{ padding: "12px 14px" }}>
                            {evt ? (
                              <button
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  padding: "4px 10px",
                                  borderRadius: "6px",
                                  border: "1px solid #E5E7EB",
                                  background: "#F9FAFB",
                                  fontSize: 12,
                                  color: "#374151",
                                  fontWeight: 500,
                                  cursor: "default",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {EVENT_TYPE_LABELS[evt.type]}
                              </button>
                            ) : (
                              <span style={{ fontSize: 12.5, color: "#9CA3AF", fontStyle: "italic" }}>Waiting</span>
                            )}
                          </td>

                          {/* Match */}
                          <td style={{ padding: "12px 14px", minWidth: 100 }}>
                            {match !== null && match !== undefined ? (
                              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                                <div
                                  style={{
                                    width: 56, height: 5, borderRadius: 3,
                                    background: "#E5E7EB", overflow: "hidden", flexShrink: 0,
                                  }}
                                >
                                  <div
                                    style={{
                                      height: "100%",
                                      width: `${match}%`,
                                      background: match >= 80 ? "#10B981" : match >= 60 ? "#F59E0B" : "#F43F5E",
                                      borderRadius: 3,
                                    }}
                                  />
                                </div>
                                <span style={{ fontSize: 12.5, fontWeight: 600, color: match >= 80 ? "#059669" : match >= 60 ? "#D97706" : "#E11D48" }}>
                                  {match}%
                                </span>
                              </div>
                            ) : (
                              <span style={{ fontSize: 12.5, color: "#D1D5DB" }}>—</span>
                            )}
                          </td>

                          {/* Action */}
                          <td style={{ padding: "12px 14px" }} onClick={(e) => e.stopPropagation()}>
                            <button
                              style={{
                                padding: "4px 10px",
                                borderRadius: "6px",
                                border: "1px solid #E5E7EB",
                                background: "#F9FAFB",
                                fontSize: 12,
                                color: "#374151",
                                cursor: "pointer",
                              }}
                              onClick={() => { setSelectedApp(app); setDetailOpen(true); }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "#F3F4F6")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && filtered.length > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 20px",
                borderTop: "1px solid #F3F4F6",
                background: "#FAFAFA",
              }}
            >
              <span style={{ fontSize: 12.5, color: "#6B7280" }}>
                Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)} to{" "}
                {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} entries
              </span>

              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{
                    height: 30, padding: "0 10px", borderRadius: 6,
                    border: "1px solid #E5E7EB", background: "#fff",
                    fontSize: 12.5, color: page === 1 ? "#D1D5DB" : "#374151",
                    cursor: page === 1 ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", gap: 3,
                  }}
                >
                  <ChevronLeft size={13} /> Prev
                </button>

                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const pg = i + 1;
                  return (
                    <button
                      key={pg}
                      onClick={() => setPage(pg)}
                      style={{
                        width: 30, height: 30, borderRadius: 6,
                        border: "1px solid " + (page === pg ? "#005F4B" : "#E5E7EB"),
                        background: page === pg ? "#005F4B" : "#fff",
                        fontSize: 12.5,
                        color: page === pg ? "#fff" : "#374151",
                        cursor: "pointer",
                        fontWeight: page === pg ? 600 : 400,
                      }}
                    >
                      {pg}
                    </button>
                  );
                })}

                {totalPages > 5 && (
                  <>
                    <span style={{ color: "#6B7280", fontSize: 13, padding: "0 4px" }}>...</span>
                    <button
                      onClick={() => setPage(totalPages)}
                      style={{
                        width: 30, height: 30, borderRadius: 6,
                        border: "1px solid #E5E7EB", background: "#fff",
                        fontSize: 12.5, color: "#374151", cursor: "pointer",
                      }}
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{
                    height: 30, padding: "0 10px", borderRadius: 6,
                    border: "1px solid #E5E7EB", background: "#fff",
                    fontSize: 12.5, color: page === totalPages ? "#D1D5DB" : "#374151",
                    cursor: page === totalPages ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", gap: 3,
                  }}
                >
                  Next <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ApplicationDetail
        application={selectedApp}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onUpdate={(updated) => {
          setApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
          setSelectedApp(updated);
        }}
      />
    </div>
  );
}
