import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format, differenceInDays } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const applications = await prisma.application.findMany({
      where: { userId: session.user.id },
      include: {
        events: {
          where: { completed: false },
          orderBy: { scheduledAt: "asc" },
        },
        statusHistory: {
          orderBy: { changedAt: "desc" },
        },
      },
    });

    const notifications = [];
    const now = new Date();

    for (const app of applications) {
      // 1. Process Events (Interviews, OAs, Offer Deadlines)
      for (const event of app.events) {
        const eventDate = new Date(event.scheduledAt);
        const daysDiff = differenceInDays(eventDate, now);
        const formattedDate = format(eventDate, "MMM d, h:mm a");

        let type: "info" | "warning" | "success" | "alert" = "info";
        let title = "Upcoming Event";
        let description = `"${event.title}" with ${app.company} on ${formattedDate}`;

        if (event.type === "OA_DEADLINE") {
          title = "Assessment Deadline";
          description = `"${event.title}" for ${app.company} is due ${formattedDate}`;
          type = daysDiff <= 1 ? "alert" : "warning";
        } else if (event.type === "OFFER_DEADLINE") {
          title = "Offer Deadline";
          description = `Respond to the offer from ${app.company} by ${formattedDate}`;
          type = "alert";
        } else if (
          [
            "PHONE_SCREEN",
            "TECHNICAL_INTERVIEW",
            "SYSTEM_DESIGN",
            "FINAL_ROUND",
            "HR_ROUND",
          ].includes(event.type)
        ) {
          title = "Upcoming Interview";
          description = `"${event.title}" with ${app.company} is scheduled for ${formattedDate}`;
          type = daysDiff <= 1 ? "alert" : "info";
        }

        notifications.push({
          id: `event-${event.id}`,
          type,
          title,
          description,
          date: event.scheduledAt,
          link: `/board`, // or direct link if application detail modal is openable
          company: app.company,
          role: app.role,
        });
      }

      // 2. Process Follow-ups (App is APPLIED for 7+ days with no events)
      if (app.status === "APPLIED") {
        const baseDate = app.appliedAt ? new Date(app.appliedAt) : new Date(app.createdAt);
        const daysApplied = differenceInDays(now, baseDate);

        if (daysApplied >= 7 && app.events.length === 0) {
          notifications.push({
            id: `followup-${app.id}`,
            type: "warning",
            title: "Follow-up Reminder",
            description: `It's been ${daysApplied} days since you applied to ${app.company} (${app.role}). Consider sending a follow-up.`,
            date: now.toISOString(),
            link: `/board`,
            company: app.company,
            role: app.role,
          });
        }
      }
    }

    // Sort notifications: alerts first, then upcoming chronologically, then warning/info
    const sortedNotifications = notifications.sort((a, b) => {
      const priority = { alert: 0, warning: 1, info: 2, success: 3 };
      const pA = priority[a.type as keyof typeof priority] ?? 2;
      const pB = priority[b.type as keyof typeof priority] ?? 2;
      if (pA !== pB) {
        return pA - pB;
      }
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    return NextResponse.json({ notifications: sortedNotifications });
  } catch (error) {
    console.error("Failed to generate notifications:", error);
    return NextResponse.json({ error: "Failed to load notifications" }, { status: 500 });
  }
}
