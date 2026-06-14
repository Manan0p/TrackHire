"use client";

import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, startOfWeek, endOfWeek } from "date-fns";
import { ApplicationDetail } from "@/components/applications/ApplicationDetail";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

  useEffect(() => {
    const fetchEvents = async () => {
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
    };
    fetchEvents();
  }, []);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const getEventsForDay = (day: Date) =>
    events.filter((e) => isSameDay(e.scheduledAt, day));

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="flex flex-col h-full bg-[var(--background)]">
      {/* Top Bar */}
      <header className="flex justify-between items-center px-6 h-14 bg-white border-b border-[var(--border)] shrink-0 z-10 w-full sticky top-0 gap-4">
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-subtle)]">Schedule</p>
          <h2 className="text-[16px] font-bold text-[var(--foreground)] leading-none">Calendar</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-[var(--border)] bg-white" onClick={() => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-[13px] font-semibold w-32 text-center text-[var(--foreground)]">
            {format(currentDate, "MMMM yyyy")}
          </span>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-[var(--border)] bg-white" onClick={() => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-[12px] border-[var(--border)] bg-white px-3" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
        </div>
      </header>

      <div className="flex-grow overflow-auto px-6 py-5">
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {dayNames.map((d) => (
            <div key={d} className="text-[11px] font-semibold text-[var(--text-muted)] text-center pb-2">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px bg-[var(--border)] rounded-xl overflow-hidden border border-[var(--border)]">
          {days.map((day) => {
            const dayEvents = getEventsForDay(day);
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isTodayDate = isToday(day);

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[120px] bg-[var(--surface)] p-2 ${!isCurrentMonth ? "opacity-40" : ""}`}
              >
                <div className={`w-6 h-6 flex items-center justify-center rounded-full text-[12px] font-medium mb-1 ${
                  isTodayDate ? "bg-[var(--primary)] text-white" : "text-[var(--text-muted)]"
                }`}>
                  {format(day, "d")}
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 3).map((evt) => (
                    <button
                      key={evt.id}
                      className="w-full text-left px-1.5 py-0.5 rounded text-[10px] font-medium truncate hover:opacity-80 transition-opacity"
                      style={{
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
                    <div className="text-[10px] text-[var(--text-subtle)] pl-1">
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
