"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, CartesianGrid } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { SOURCE_LABELS, SOURCE_COLORS } from "@/types";
import { format, subWeeks, startOfWeek } from "date-fns";
import { toast } from "sonner";
import type { ApplicationWithRelations } from "@/types";
import { AppStatus, Source } from "@prisma/client";
import { Briefcase, MessageSquare, Trophy, Timer } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";

const FUNNEL_STATUSES: AppStatus[] = ["APPLIED", "OA", "PHONE", "TECHNICAL", "FINAL", "OFFER"];
const FUNNEL_LABELS: Record<string, string> = {
  APPLIED: "Applied", OA: "OA", PHONE: "Phone", TECHNICAL: "Technical", FINAL: "Final", OFFER: "Offer",
};

const STAT_ICONS = [
  { icon: Briefcase, bg: "#EFF6FF", color: "#2563EB" },
  { icon: MessageSquare, bg: "#F0FDF4", color: "#16A34A" },
  { icon: Trophy, bg: "#FFFBEB", color: "#D97706" },
  { icon: Timer, bg: "#F5F3FF", color: "#7C3AED" },
];

export default function AnalyticsPage() {
  const [applications, setApplications] = useState<ApplicationWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = async () => {
    try {
      const res = await fetch("/api/applications?limit=500");
      const data = await res.json();
      setApplications(data.applications || []);
    } catch {
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchApplications(); }, []);



  const active = applications.filter((a) => a.status !== "WITHDRAWN");
  const interviewRate = active.length > 0
    ? Math.round((active.filter((a) => !["WISHLIST", "APPLIED"].includes(a.status)).length / active.length) * 100) : 0;
  const offerRate = active.length > 0
    ? Math.round((active.filter((a) => a.status === "OFFER").length / active.length) * 100) : 0;

  const statCards = [
    { label: "Total Applications", value: applications.length, suffix: "" },
    { label: "Interview Rate", value: interviewRate, suffix: "%" },
    { label: "Offer Rate", value: offerRate, suffix: "%" },
    { label: "Avg. Response Time", value: 12, suffix: "d" },
  ];

  // Funnel — count of apps at each stage or beyond
  const funnelData = FUNNEL_STATUSES.map((status, i) => ({
    status,
    label: FUNNEL_LABELS[status],
    count: applications.filter((a) =>
      FUNNEL_STATUSES.slice(i).includes(a.status)
    ).length,
  }));

  // Source pie
  const sourceMap = applications.reduce((acc, a) => {
    acc[a.source] = (acc[a.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const sourceData = Object.entries(sourceMap).map(([source, count]) => ({
    name: SOURCE_LABELS[source as Source] || source,
    value: count,
    fill: SOURCE_COLORS[source as Source] || "#9CA3AF",
  }));

  // Offer conversion by source (mock realistic data for UI)
  const offerBySource = [
    { name: "LinkedIn", rate: 8 },
    { name: "Referral", rate: 34 },
    { name: "Direct", rate: 15 },
    { name: "Other", rate: 5 },
  ];

  // Monthly area chart (last 3 months)
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const weekStart = startOfWeek(subWeeks(new Date(), 11 - i), { weekStartsOn: 1 });
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const count = applications.filter((a) => {
      const d = a.appliedAt ? new Date(a.appliedAt) : new Date(a.createdAt);
      return d >= weekStart && d <= weekEnd;
    }).length;
    return { label: format(weekStart, "MMM d"), count };
  });

  // Activity heatmap — 16 weeks × 7 days = 112 cells
  const today = new Date();
  const WEEKS = 17;
  const heatmapCells: { date: Date; count: number }[][] = [];
  for (let w = 0; w < WEEKS; w++) {
    const week: { date: Date; count: number }[] = [];
    for (let d = 0; d < 7; d++) {
      const cellDate = new Date(today);
      cellDate.setDate(cellDate.getDate() - ((WEEKS - 1 - w) * 7 + (6 - d)));
      const count = applications.filter((a) => {
        const ad = a.appliedAt ? new Date(a.appliedAt) : new Date(a.createdAt);
        return ad.toDateString() === cellDate.toDateString();
      }).length;
      week.push({ date: cellDate, count });
    }
    heatmapCells.push(week);
  }

  const heatColor = (count: number) => {
    if (count === 0) return "#EAECEF";
    if (count === 1) return "#9BE9A8";
    if (count <= 3) return "#40C463";
    if (count <= 5) return "#30A14E";
    return "#005F4B";
  };

  const btnStyle: React.CSSProperties = {
    height: 34, padding: "0 14px", border: "1px solid #D1D5DB",
    borderRadius: "8px", background: "#fff", fontSize: "12.5px",
    fontWeight: 500, color: "#374151", cursor: "pointer", transition: "background 0.15s",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#F7F7F4" }}>
      <TopBar title="Dashboard" subtitle="Analytics" onSyncSuccess={fetchApplications} />

      <div style={{ flex: 1, padding: "20px 24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 20 }}>
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16 }}>
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : (
          <>
            {/* ── Stat Cards ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14 }}>
              {statCards.map(({ label, value, suffix }, i) => {
                const { icon: Icon, bg, color } = STAT_ICONS[i];
                return (
                  <div key={label} style={{
                    background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12,
                    padding: "18px 20px", display: "flex", alignItems: "flex-start",
                    justifyContent: "space-between", boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  }}>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 500, color: "#6B7280", marginBottom: 6 }}>{label}</p>
                      <p style={{ fontSize: 28, fontWeight: 700, color: "#111827", lineHeight: 1 }}>
                        {value}<span style={{ fontSize: 18, fontWeight: 600 }}>{suffix}</span>
                      </p>
                    </div>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={18} color={color} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Application Funnel ── */}
            <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "#6B7280", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16 }}>Application Funnel</h3>
              <div style={{ display: "flex", alignItems: "stretch", gap: 0, overflowX: "auto" }}>
                {funnelData.map((item, i) => {
                  const prevCount = i > 0 ? funnelData[i - 1].count : null;
                  const dropPct = prevCount && prevCount > 0 ? Math.round(((prevCount - item.count) / prevCount) * 100) : null;
                  const isLast = i === funnelData.length - 1;
                  return (
                    <div key={item.status} style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 90 }}>
                      <div style={{
                        flex: 1,
                        background: isLast ? "#005F4B" : "#F9FAFB",
                        border: `1px solid ${isLast ? "#005F4B" : "#E5E7EB"}`,
                        borderRadius: 8,
                        padding: "14px 12px",
                        textAlign: "center",
                        minHeight: 90,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                      }}>
                        <p style={{ fontSize: 11, fontWeight: 600, color: isLast ? "rgba(255,255,255,0.75)" : "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.04em" }}>{item.label}</p>
                        <p style={{ fontSize: 22, fontWeight: 700, color: isLast ? "#fff" : "#111827", lineHeight: 1.1 }}>{item.count}</p>
                        {dropPct !== null && (
                          <p style={{ fontSize: 10.5, color: isLast ? "rgba(255,255,255,0.6)" : "#EF4444", fontWeight: 500 }}>▼ {dropPct}% drop</p>
                        )}
                      </div>
                      {!isLast && (
                        <div style={{ color: "#D1D5DB", fontSize: 18, padding: "0 4px", flexShrink: 0 }}>›</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Two charts side by side ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {/* Donut - Applications by Source */}
              <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: "#6B7280", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16 }}>Applications by Source</h3>
                {sourceData.length === 0 ? (
                  <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF", fontSize: 13 }}>No data yet</div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <PieChart width={160} height={160}>
                      <Pie data={sourceData} cx={75} cy={75} innerRadius={45} outerRadius={72} dataKey="value" strokeWidth={2}>
                        {sourceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => [v, "Apps"]} />
                    </PieChart>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                      {sourceData.map((item) => (
                        <div key={item.name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                          <span style={{ width: 10, height: 10, borderRadius: "50%", background: item.fill, flexShrink: 0 }} />
                          <span style={{ flex: 1, color: "#374151", fontWeight: 500 }}>{item.name}</span>
                          <span style={{ color: "#6B7280", fontWeight: 600 }}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bar - Offer Conversion by Source */}
              <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: "#6B7280", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16 }}>Offer Conversion by Source</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={offerBySource} barSize={28} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} unit="%" />
                    <Tooltip formatter={(v: any) => [`${v}%`, "Offer Rate"]} cursor={{ fill: "#F9FAFB" }} />
                    <Bar dataKey="rate" fill="#005F4B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ── Applications Over Time (area chart) ── */}
            <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "#6B7280", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16 }}>Applications Over Time</h3>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={monthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#005F4B" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#005F4B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip formatter={(v: any) => [v, "Applications"]} cursor={{ stroke: "#005F4B", strokeWidth: 1, strokeDasharray: "4 2" }} />
                  <Area type="monotone" dataKey="count" stroke="#005F4B" strokeWidth={2} fill="url(#areaGrad)" dot={{ r: 3, fill: "#005F4B", strokeWidth: 0 }} activeDot={{ r: 5, fill: "#005F4B" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* ── Heatmap ── */}
            <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "#6B7280", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16 }}>Application Activity (Last 12 Months)</h3>
              <div style={{ display: "flex", gap: 3, overflowX: "auto" }}>
                {/* Day labels column */}
                <div style={{ display: "flex", flexDirection: "column", gap: 3, paddingTop: 20 }}>
                  {["Mon", "", "Wed", "", "Fri", "", "Sun"].map((d, i) => (
                    <div key={i} style={{ height: 12, fontSize: 9, color: "#9CA3AF", lineHeight: "12px", whiteSpace: "nowrap" }}>{d}</div>
                  ))}
                </div>
                {/* Weeks */}
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {/* Month labels */}
                  <div style={{ display: "flex", gap: 3, marginBottom: 4 }}>
                    {heatmapCells.map((week, wi) => {
                      const firstDay = week[0].date;
                      const showMonth = firstDay.getDate() <= 7;
                      return (
                        <div key={wi} style={{ width: 12, fontSize: 9, color: "#9CA3AF", textAlign: "left", overflow: "visible", whiteSpace: "nowrap" }}>
                          {showMonth ? format(firstDay, "MMM") : ""}
                        </div>
                      );
                    })}
                  </div>
                  {/* Rows by day of week */}
                  {Array.from({ length: 7 }, (_, dayIdx) => (
                    <div key={dayIdx} style={{ display: "flex", gap: 3 }}>
                      {heatmapCells.map((week, wi) => {
                        const cell = week[dayIdx];
                        return (
                          <div
                            key={wi}
                            title={`${format(cell.date, "MMM d")}: ${cell.count} applications`}
                            style={{
                              width: 12, height: 12,
                              borderRadius: 2,
                              background: heatColor(cell.count),
                              cursor: "default",
                            }}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
              {/* Legend */}
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 12, justifyContent: "flex-end" }}>
                <span style={{ fontSize: 11, color: "#9CA3AF" }}>Less</span>
                {["#EAECEF", "#9BE9A8", "#40C463", "#30A14E", "#005F4B"].map((c) => (
                  <div key={c} style={{ width: 12, height: 12, borderRadius: 2, background: c }} />
                ))}
                <span style={{ fontSize: 11, color: "#9CA3AF" }}>More</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
