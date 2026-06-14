import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createEventSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const app = await prisma.application.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const events = await prisma.event.findMany({
    where: { applicationId: id },
    orderBy: { scheduledAt: "asc" },
  });

  return NextResponse.json(events);
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const app = await prisma.application.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = createEventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const event = await prisma.event.create({
    data: { ...parsed.data, applicationId: id },
  });

  return NextResponse.json(event, { status: 201 });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: appId } = await params;
  const body = await req.json();
  const { eventId, ...data } = body;

  if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 });

  const app = await prisma.application.findFirst({
    where: { id: appId, userId: session.user.id },
  });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const event = await prisma.event.update({
    where: { id: eventId, applicationId: appId },
    data,
  });

  return NextResponse.json(event);
}
