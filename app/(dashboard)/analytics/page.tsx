"use client";

import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area, CartesianGrid,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { STATUS_LABELS, STATUS_COLORS, SOURCE_LABELS, SOURCE_COLORS } from "@/types";
import { format, subWeeks, startOfWeek } from "date-fns";
import { toast } from "sonner";
import type { ApplicationWithRelations } from "@/types";
import { AppStatus, Source } from "@prisma/client";
import { Briefcase, MessageSquare, Trophy, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

const FUNNEL_STATUSES: AppStatus[] = ["APPLIED", "OA", "PHONE", "TECHNICAL", "FINAL", "OFFER"];

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

  useEffect(() => {
    void fetchApplications();
  }, []);

  const active = applications.filter((a) => !["WITHDRAWN"].includes(a.status));
  const interviewRate = active.length > 0
    ? Math.round((active.filter((a) => !["WISHLIST", "APPLIED"].includes(a.status)).length / active.length) * 100)
    : 0;
  const offerRate = active.length > 0
    ? Math.round((active.filter((a) => a.status === "OFFER").length / active.length) * 100)
    : 0;

  // Funnel data
  const funnelData = FUNNEL_STATUSES.map((status) => ({
    name: STATUS_LABELS[status],
    value: applications.filter((a) => FUNNEL_STATUSES.slice(FUNNEL_STATUSES.indexOf(status)).includes(a.status)).length,
    fill: STATUS_COLORS[status],
  }));

  // Source breakdown
  const sourceData = Object.entries(
    applications.reduce((acc, a) => {
      acc[a.source] = (acc[a.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([source, count]) => ({
    name: SOURCE_LABELS[source as Source] || source,
    value: count,
    fill: SOURCE_COLORS[source as Source] || "#9CA3AF",
  }));

  // Weekly applications (last 12 weeks)
  const weeklyData = Array.from({ length: 12 }, (_, i) => {
    const weekStart = startOfWeek(subWeeks(new Date(), 11 - i), { weekStartsOn: 1 });
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const count = applications.filter((a) => {
      const d = a.appliedAt ? new Date(a.appliedAt) : new Date(a.createdAt);
      return d >= weekStart && d <= weekEnd;
    }).length;
    return { week: format(weekStart, "MMM d"), count };
  });

  // Activity heatmap (last 12 weeks, 7 days each)
  const today = new Date();
  const heatmapCells = Array.from({ length: 84 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (83 - i));
    const count = applications.filter((a) => {
      const ad = a.appliedAt ? new Date(a.appliedAt) : new Date(a.createdAt);
      return ad.toDateString() === d.toDateString();
    }).length;
    return { date: d, count };
  });

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

  const statCards = [
    { label: "Total Applications", value: applications.length, suffix: "", icon: Briefcase, bgClass: "bg-blue-50 text-blue-600 border-blue-100" },
    { label: "Interview Rate", value: interviewRate, suffix: "%", icon: MessageSquare, bgClass: "bg-emerald-50 text-emerald-600 border-emerald-100" },
    { label: "Offer Rate", value: offerRate, suffix: "%", icon: Trophy, bgClass: "bg-amber-50 text-amber-600 border-amber-100" },
    { label: "Avg. Response Time", value: 12, suffix: "d", icon: Timer, bgClass: "bg-slate-50 text-slate-600 border-slate-100" },
  ];

  return (
    <div className="flex flex-col h-full bg-[var(--background)]">
      {/* Top Bar */}
      <header className="flex justify-between items-center px-6 h-14 bg-white border-b border-[var(--border)] shrink-0 z-10 w-full sticky top-0 gap-4">
        <div className="flex items-center gap-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-subtle)] mb-0.5">Analytics</p>
          <h2 className="text-[16px] font-bold text-[var(--foreground)] leading-none">Dashboard</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 bg-white text-[13px] hover:bg-slate-50 border-[var(--border)] text-[var(--foreground)] px-3"
            onClick={handleGmailSync}
          >
            Sync Gmail
          </Button>
        </div>
      </header>

      <div className="flex-grow overflow-auto px-6 py-5">
        <div className="max-w-[1400px] mx-auto flex flex-col gap-5">
          {loading ? (
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map(({ label, value, suffix, icon: Icon, bgClass }) => (
                  <div key={label} className="bg-white p-5 rounded-xl border border-[var(--border)] shadow-sm hover:border-[var(--primary)] transition-all flex items-start justify-between">
                    <div>
                      <p className="text-[12px] font-medium text-[var(--text-muted)] mb-1">{label}</p>
                      <p className="text-3xl font-bold text-[var(--foreground)] tracking-tight">
                        {value}<span className="text-xl font-semibold">{suffix}</span>
                      </p>
                    </div>
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center border", bgClass)}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Funnel + Source */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-[var(--border)] rounded-xl p-5 shadow-sm">
                  <h3 className="text-[13px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-4">Application Funnel</h3>
                  <div className="flex flex-col gap-2.5">
                    {funnelData.map((item, index) => {
                      const maxVal = Math.max(...funnelData.map((d) => d.value)) || 1;
                      const widthPct = (item.value / maxVal) * 100;
                      return (
                        <div key={item.name} className="flex items-center gap-3">
                          <div className="w-24 text-[12px] font-medium text-[var(--text-muted)] text-right truncate">
                            {item.name}
                          </div>
                          <div className="flex-1 bg-[var(--surface-container-low)] rounded-lg h-8 overflow-hidden relative border border-[var(--border)]/10">
                            <div
                              className="h-full rounded-lg transition-all duration-500 shadow-sm"
                              style={{ width: `${widthPct}%`, backgroundColor: item.fill }}
                            />
                            <span className="absolute inset-y-0 left-3 flex items-center text-[11px] font-bold text-white shadow-sm">
                              {item.value} applications
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white border border-[var(--border)] rounded-xl p-5 shadow-sm">
                  <h3 className="text-[13px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-4">Sources</h3>
                  <div className="flex-1 flex flex-col justify-center h-full min-h-[220px]">
                    {sourceData.length === 0 ? (
                      <div className="text-center text-[13px] text-[var(--text-muted)] py-12">No source data available</div>
                    ) : (
                      <div className="space-y-3">
                        {sourceData.map((item) => {
                          const total = sourceData.reduce((acc, d) => acc + d.value, 0) || 1;
                          const pct = Math.round((item.value / total) * 100);
                          return (
                            <div key={item.name} className="space-y-1">
                              <div className="flex justify-between items-center text-[12px]">
                                <span className="font-semibold text-[var(--text-muted)] flex items-center gap-2">
                                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: item.fill }} />
                                  {item.name}
                                </span>
                                <span className="font-bold text-[var(--text-muted)]">{item.value} ({pct}%)</span>
                              </div>
                              <div className="h-2 w-full bg-[var(--surface-container-low)] rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: item.fill }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Weekly area chart */}
              <div className="bg-white border border-[var(--border)] rounded-xl p-5 shadow-sm">
                <h3 className="text-[13px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-4">Applications per Week</h3>
                <div className="flex items-end justify-between h-[200px] border-b border-l border-[var(--border)]/60 pt-4 pl-4 relative">
                  {weeklyData.map((item) => {
                    const maxCount = Math.max(...weeklyData.map((d) => d.count)) || 1;
                    const heightPct = (item.count / maxCount) * 80;
                    return (
                      <div key={item.week} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                        <div
                          className="w-8 bg-[var(--primary)] hover:bg-[var(--primary-container)] rounded-t-sm transition-all duration-300 relative"
                          style={{ height: `${heightPct}%` }}
                        >
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 font-bold text-[10px] text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.count}
                          </div>
                        </div>
                        <span className="text-[10px] text-[var(--text-subtle)] mt-2 font-medium">
                          {item.week}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Activity Heatmap */}
              <div className="bg-white border border-[var(--border)] rounded-xl p-5 shadow-sm">
                <h3 className="text-[13px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-4">Activity (Last 12 Weeks)</h3>
                <div className="flex gap-1 flex-wrap">
                  {heatmapCells.map(({ date, count }, i) => (
                    <div
                      key={i}
                      className="w-3.5 h-3.5 rounded-sm transition-colors"
                      title={`${format(date, "MMM d")}: ${count} activity`}
                      style={{
                        backgroundColor:
                          count === 0 ? "var(--surface-container-low)"
                          : count === 1 ? "var(--primary-light)"
                          : count <= 3 ? "var(--primary-container)"
                          : "var(--primary)",
                      }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1.5 mt-3 justify-end">
                  <span className="text-[11px] text-[var(--text-subtle)]">Less</span>
                  {["var(--surface-container-low)", "var(--primary-light)", "var(--primary-container)", "var(--primary)"].map((c, i) => (
                    <div key={i} className="w-3.5 h-3.5 rounded-sm" style={{ backgroundColor: c }} />
                  ))}
                  <span className="text-[11px] text-[var(--text-subtle)]">More</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
