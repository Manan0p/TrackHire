import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createApplicationSchema, listApplicationsSchema } from "@/lib/validators";
import { AppStatus, Source } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const params = listApplicationsSchema.safeParse({
    status: searchParams.get("status") || undefined,
    source: searchParams.get("source") || undefined,
    search: searchParams.get("search") || undefined,
    page: searchParams.get("page") || 1,
    limit: searchParams.get("limit") || 50,
  });

  if (!params.success) {
    return NextResponse.json({ error: params.error.flatten() }, { status: 400 });
  }

  const { status, source, search, page, limit } = params.data;
  const skip = (page - 1) * limit;

  const where = {
    userId: session.user.id,
    ...(status && { status: status as AppStatus }),
    ...(source && { source: source as Source }),
    ...(search && {
      OR: [
        { company: { contains: search, mode: "insensitive" as const } },
        { role: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ boardOrder: "asc" }, { createdAt: "desc" }],
      include: {
        events: {
          where: { completed: false, scheduledAt: { gte: new Date() } },
          orderBy: { scheduledAt: "asc" },
          take: 1,
        },
        emails: { orderBy: { lastMessageAt: "desc" }, take: 1 },
        _count: { select: { events: true, emails: true } },
      },
    }),
    prisma.application.count({ where }),
  ]);

  return NextResponse.json({ applications, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createApplicationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const application = await prisma.application.create({
    data: {
      ...parsed.data,
      userId: session.user.id,
      statusHistory: {
        create: {
          toStatus: parsed.data.status || "APPLIED",
          note: "Application created",
        },
      },
    },
    include: {
      events: true,
      statusHistory: true,
      emails: true,
    },
  });

  return NextResponse.json(application, { status: 201 });
}
