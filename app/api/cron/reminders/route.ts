import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReminderEmail } from "@/lib/email";
import { addDays, subDays, isAfter, isBefore } from "date-fns";

export async function GET(req: NextRequest) {
  const cronSecret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const in24h = addDays(now, 1);
  const in48h = addDays(now, 2);
  const ago14d = subDays(now, 14);
  const ago30d = subDays(now, 30);

  // Get all users
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true },
  });

  const results: Record<string, number> = {};

  for (const user of users) {
    const reminders: Array<{ type: string; title: string; company: string; date?: string }> = [];

    // 1. Events in next 24h
    const upcomingEvents = await prisma.event.findMany({
      where: {
        completed: false,
        scheduledAt: { gte: now, lte: in24h },
        application: { userId: user.id },
      },
      include: { application: { select: { company: true } } },
    });
    for (const evt of upcomingEvents) {
      reminders.push({
        type: "event",
        title: evt.title,
        company: evt.application.company,
        date: evt.scheduledAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      });
    }

    // 2. OA deadlines in 48h
    const oaDeadlines = await prisma.event.findMany({
      where: {
        type: "OA_DEADLINE",
        completed: false,
        scheduledAt: { gte: now, lte: in48h },
        application: { userId: user.id },
      },
      include: { application: { select: { company: true } } },
    });
    for (const evt of oaDeadlines) {
      reminders.push({
        type: "oa_deadline",
        title: `OA Deadline: ${evt.title}`,
        company: evt.application.company,
        date: evt.scheduledAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      });
    }

    // 3. Stale applications (14+ days no activity)
    const staleApps = await prisma.application.findMany({
      where: {
        userId: user.id,
        status: { in: ["APPLIED", "OA", "PHONE", "TECHNICAL"] },
        updatedAt: { lte: ago14d },
      },
      select: { company: true, role: true, updatedAt: true },
    });
    for (const app of staleApps.slice(0, 3)) {
      reminders.push({
        type: "stale",
        title: `No activity — consider following up for ${app.role}`,
        company: app.company,
      });
    }

    // 4. Ghosted candidates (30+ days in APPLIED)
    const ghostedApps = await prisma.application.findMany({
      where: {
        userId: user.id,
        status: "APPLIED",
        appliedAt: { lte: ago30d },
      },
      select: { company: true, role: true },
    });
    for (const app of ghostedApps.slice(0, 2)) {
      reminders.push({
        type: "ghosted",
        title: `30+ days no response — consider marking as Ghosted`,
        company: app.company,
      });
    }

    if (reminders.length > 0) {
      try {
        await sendReminderEmail(user.email, user.name || "", reminders);
        results[user.email] = reminders.length;
      } catch (err) {
        console.error(`Failed to send reminder to ${user.email}:`, err);
      }
    }
  }

  return NextResponse.json({ success: true, sent: Object.keys(results).length, results });
}
