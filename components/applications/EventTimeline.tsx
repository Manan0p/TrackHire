"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Check, Plus, Calendar, MapPin, FileText, Clock, Loader2 } from "lucide-react";
import { EventRecord } from "@/types";
import { EVENT_TYPE_LABELS, EVENT_TYPE_COLORS } from "@/types";
import { cn, formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { EventType } from "@prisma/client";

interface EventTimelineProps {
  events: EventRecord[];
  applicationId: string;
  onEventAdded: (event: EventRecord) => void;
  onEventUpdated: (event: EventRecord) => void;
}

export function EventTimeline({
  events,
  applicationId,
  onEventAdded,
  onEventUpdated,
}: EventTimelineProps) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    type: "TECHNICAL_INTERVIEW" as EventType,
    title: "",
    scheduledAt: "",
    durationMins: 60,
    location: "",
    notes: "",
  });

  const sorted = [...events].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  );

  const handleMarkComplete = async (event: EventRecord) => {
    try {
      const res = await fetch(`/api/applications/${applicationId}/events`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: event.id, completed: !event.completed }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      onEventUpdated(updated);
      toast.success(updated.completed ? "Marked complete" : "Marked incomplete");
    } catch {
      toast.error("Failed to update event");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/applications/${applicationId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          scheduledAt: new Date(form.scheduledAt).toISOString(),
          durationMins: Number(form.durationMins),
        }),
      });
      if (!res.ok) throw new Error();
      const event = await res.json();
      onEventAdded(event);
      setShowForm(false);
      setForm({ type: "TECHNICAL_INTERVIEW", title: "", scheduledAt: "", durationMins: 60, location: "", notes: "" });
      toast.success("Event added");
    } catch {
      toast.error("Failed to add event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Timeline */}
      <div className="space-y-2">
        {sorted.length === 0 && !showForm && (
          <div className="text-center py-8">
            <Calendar className="w-8 h-8 text-[var(--text-subtle)] mx-auto mb-2" />
            <p className="text-sm text-[var(--text-muted)]">No events yet</p>
            <p className="text-xs text-[var(--text-subtle)] mt-1">Add an interview, deadline, or follow-up</p>
          </div>
        )}

        {sorted.map((event) => {
          const color = EVENT_TYPE_COLORS[event.type];
          const isPast = new Date(event.scheduledAt) < new Date();
          return (
            <div
              key={event.id}
              className={cn(
                "flex gap-3 p-3 rounded-lg border transition-all",
                event.completed
                  ? "opacity-60 bg-[var(--background)] border-[var(--border)]"
                  : "bg-[var(--surface)] border-[var(--border)]"
              )}
            >
              {/* Color dot */}
              <div className="flex-shrink-0 flex flex-col items-center mt-0.5">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: event.completed ? "#9CA3AF" : color }}
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wide"
                      style={{ color: event.completed ? "#9CA3AF" : color }}
                    >
                      {EVENT_TYPE_LABELS[event.type]}
                    </span>
                    <p className="text-[13px] font-medium text-[var(--foreground)] mt-0.5">
                      {event.title}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                        <Clock className="w-3 h-3" />
                        {formatDateTime(event.scheduledAt)}
                        {event.durationMins && ` · ${event.durationMins}min`}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                          <MapPin className="w-3 h-3" />
                          <a
                            href={event.location.startsWith("http") ? event.location : `https://${event.location}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline hover:text-[var(--primary)]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {event.location.length > 30
                              ? event.location.slice(0, 30) + "…"
                              : event.location}
                          </a>
                        </span>
                      )}
                    </div>
                    {event.notes && (
                      <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-relaxed">
                        {event.notes}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleMarkComplete(event)}
                    className={cn(
                      "flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                      event.completed
                        ? "bg-green-500 border-green-500 text-white"
                        : "border-[var(--border)] hover:border-green-500 text-transparent hover:text-green-500"
                    )}
                    title={event.completed ? "Mark incomplete" : "Mark complete"}
                  >
                    <Check className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Event Form */}
      {showForm ? (
        <form onSubmit={handleSubmit} className="p-3 border border-[var(--border)] rounded-lg space-y-3 bg-[var(--background)]">
          <p className="text-[13px] font-semibold text-[var(--foreground)]">New Event</p>

          <Select
            value={form.type}
            onValueChange={(v) => setForm((f) => ({ ...f, type: v as EventType }))}
          >
            <SelectTrigger className="h-8 text-[13px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key} className="text-[13px]">
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="Event title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
            className="h-8 text-[13px]"
          />

          <div className="grid grid-cols-2 gap-2">
            <Input
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
              required
              className="h-8 text-[13px]"
            />
            <Input
              type="number"
              placeholder="Duration (mins)"
              value={form.durationMins}
              onChange={(e) => setForm((f) => ({ ...f, durationMins: Number(e.target.value) }))}
              className="h-8 text-[13px]"
            />
          </div>

          <Input
            placeholder="Location / Zoom link"
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            className="h-8 text-[13px]"
          />

          <Textarea
            placeholder="Notes (optional)"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className="text-[13px] min-h-[60px]"
          />

          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={loading} className="flex-1 h-8 text-[13px] bg-[var(--primary)] hover:bg-[var(--primary-dark)]">
              {loading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
              Add Event
            </Button>
            <Button type="button" size="sm" variant="outline" className="h-8 text-[13px]" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="w-full h-8 text-[13px] border-dashed"
          onClick={() => setShowForm(true)}
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Add Event
        </Button>
      )}
    </div>
  );
}
