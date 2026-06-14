import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getValidAccessToken } from "@/lib/google-token";
import { EVENT_TYPE_LABELS } from "@/types";

const CALENDAR_API = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
const TIME_ZONE = "Asia/Kolkata";

function buildTitle(company: string, eventType: string): string {
  return `${company} — ${eventType}`;
}

function buildDescription(role: string, jobUrl: string | null | undefined, notes: string | null | undefined): string {
  const parts = [`Role: ${role}`];
  if (jobUrl) parts.push(`Job URL: ${jobUrl}`);
  if (notes) parts.push(`\nNotes:\n${notes}`);
  return parts.join("\n");
}

// POST /api/integrations/calendar — create a Google Calendar event for an interview
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId, applicationId } = await req.json() as { eventId: string; applicationId: string };

  const [event, application] = await Promise.all([
    prisma.event.findFirst({ where: { id: eventId } }),
    prisma.application.findFirst({ where: { id: applicationId, userId: session.user.id } }),
  ]);

  if (!event || !application) {
    return NextResponse.json({ error: "Event or application not found" }, { status: 404 });
  }

  let accessToken: string;
  try {
    accessToken = await getValidAccessToken(session.user.id);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Token error";
    return NextResponse.json({ error: message, needsReauth: true }, { status: 401 });
  }

  const endTime = new Date(event.scheduledAt);
  endTime.setMinutes(endTime.getMinutes() + (event.durationMins || 60));

  const calendarEventBody = {
    summary: buildTitle(application.company, EVENT_TYPE_LABELS[event.type]),
    description: buildDescription(application.role, application.jobUrl, event.notes),
    start: { dateTime: event.scheduledAt.toISOString(), timeZone: TIME_ZONE },
    end: { dateTime: endTime.toISOString(), timeZone: TIME_ZONE },
    ...(event.location ? { location: event.location } : {}),
  };

  const res = await fetch(CALENDAR_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(calendarEventBody),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: "Google Calendar API error", details: err }, { status: 502 });
  }

  const created = await res.json() as { id: string; htmlLink: string };

  // Persist the calendar event ID on the event record
  const updatedEvent = await prisma.event.update({
    where: { id: eventId },
    data: { calendarEventId: created.id },
  });

  return NextResponse.json({ event: updatedEvent, calendarEventId: created.id, htmlLink: created.htmlLink });
}

// PATCH /api/integrations/calendar — update an existing calendar event
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId } = await req.json() as { eventId: string };

  const event = await prisma.event.findFirst({ where: { id: eventId } });
  const application = event
    ? await prisma.application.findFirst({ where: { id: event.applicationId, userId: session.user.id } })
    : null;

  if (!event || !application || !event.calendarEventId) {
    return NextResponse.json({ error: "Event not found or no calendar event linked" }, { status: 404 });
  }

  let accessToken: string;
  try {
    accessToken = await getValidAccessToken(session.user.id);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Token error";
    return NextResponse.json({ error: message, needsReauth: true }, { status: 401 });
  }

  const endTime = new Date(event.scheduledAt);
  endTime.setMinutes(endTime.getMinutes() + (event.durationMins || 60));

  const patchBody = {
    summary: buildTitle(application.company, EVENT_TYPE_LABELS[event.type]),
    description: buildDescription(application.role, application.jobUrl, event.notes),
    start: { dateTime: event.scheduledAt.toISOString(), timeZone: TIME_ZONE },
    end: { dateTime: endTime.toISOString(), timeZone: TIME_ZONE },
    ...(event.location ? { location: event.location } : {}),
  };

  const res = await fetch(`${CALENDAR_API}/${event.calendarEventId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(patchBody),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: "Google Calendar API error", details: err }, { status: 502 });
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/integrations/calendar — remove a calendar event
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");
  if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 });

  const event = await prisma.event.findFirst({ where: { id: eventId } });
  const application = event
    ? await prisma.application.findFirst({ where: { id: event.applicationId, userId: session.user.id } })
    : null;

  if (!event || !application) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  if (event.calendarEventId) {
    let accessToken: string;
    try {
      accessToken = await getValidAccessToken(session.user.id);
      await fetch(`${CALENDAR_API}/${event.calendarEventId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch {
      // If calendar delete fails, still clear the ID from DB
    }
  }

  await prisma.event.update({ where: { id: eventId }, data: { calendarEventId: null } });
  return NextResponse.json({ success: true });
}
