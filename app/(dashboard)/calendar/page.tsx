"use client";

import { useState, useEffect, useCallback } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, startOfWeek, endOfWeek } from "date-fns";
import { ApplicationDetail } from "@/components/applications/ApplicationDetail";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { EVENT_TYPE_COLORS, EVENT_TYPE_LABELS } from "@/types";
import { toast } from "sonner";
import type { ApplicationWithRelations } from "@/types";

interface FlatEvent {
  id: string;
  type: string;
  title: string;
  scheduledAt: Date;
  application: ApplicationWithRelations;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<FlatEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<ApplicationWithRelations | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/applications?limit=200");
      const data = await res.json();
      const apps: ApplicationWithRelations[] = data.applications || [];
      const flat: FlatEvent[] = [];
      for (const app of apps) {
        for (const evt of app.events || []) {
          flat.push({
            id: evt.id,
            type: evt.type,
            title: evt.title,
            scheduledAt: new Date(evt.scheduledAt),
            application: app,
          });
        }
      }
      setEvents(flat);
    } catch {
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const getEventsForDay = (day: Date) =>
    events.filter((e) => isSameDay(e.scheduledAt, day));

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#F7F7F4" }}>
      <TopBar title="Calendar" subtitle="Schedule" onSyncSuccess={fetchEvents}>
        {/* Month navigation */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            onClick={() => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
            style={{ width: 32, height: 32, border: "1px solid #E5E7EB", borderRadius: 6, background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#374151" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
          >
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#111827", width: 130, textAlign: "center" }}>
            {format(currentDate, "MMMM yyyy")}
          </span>
          <button
            onClick={() => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
            style={{ width: 32, height: 32, border: "1px solid #E5E7EB", borderRadius: 6, background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#374151" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            style={{ height: 32, padding: "0 14px", border: "1px solid #E5E7EB", borderRadius: 6, background: "#fff", fontSize: 12.5, fontWeight: 500, color: "#374151", cursor: "pointer", marginLeft: 4 }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
          >
            Today
          </button>
        </div>
      </TopBar>

      <div style={{ flex: 1, padding: "16px 24px", overflow: "auto" }}>
        {/* Day headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 6 }}>
          {dayNames.map((d) => (
            <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: "#6B7280", padding: "0 0 8px" }}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(7, 1fr)",
          border: "1px solid #E5E7EB", borderRadius: 10, overflow: "hidden",
          background: "#E5E7EB", gap: "1px",
        }}>
          {days.map((day) => {
            const dayEvents = getEventsForDay(day);
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isTodayDate = isToday(day);

            return (
              <div
                key={day.toISOString()}
                style={{
                  minHeight: 110,
                  background: "#ffffff",
                  padding: "8px",
                  opacity: isCurrentMonth ? 1 : 0.4,
                }}
              >
                <div style={{
                  width: 24, height: 24,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: "50%",
                  fontSize: 12, fontWeight: 500,
                  marginBottom: 4,
                  background: isTodayDate ? "#005F4B" : "transparent",
                  color: isTodayDate ? "#ffffff" : "#374151",
                }}>
                  {format(day, "d")}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {dayEvents.slice(0, 3).map((evt) => (
                    <button
                      key={evt.id}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "2px 6px",
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 500,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        border: "none",
                        cursor: "pointer",
                        backgroundColor: `${EVENT_TYPE_COLORS[evt.type as keyof typeof EVENT_TYPE_COLORS]}25`,
                        color: EVENT_TYPE_COLORS[evt.type as keyof typeof EVENT_TYPE_COLORS],
                      }}
                      onClick={() => {
                        setSelectedApp(evt.application);
                        setDetailOpen(true);
                      }}
                    >
                      {evt.application.company} · {EVENT_TYPE_LABELS[evt.type as keyof typeof EVENT_TYPE_LABELS]}
                    </button>
                  ))}
                  {dayEvents.length > 3 && (
                    <div style={{ fontSize: 10, color: "#9CA3AF", paddingLeft: 4 }}>
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ApplicationDetail
        application={selectedApp}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onUpdate={(updated) => setSelectedApp(updated)}
      />
    </div>
  );
}
