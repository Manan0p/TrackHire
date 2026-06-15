import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateApplicationSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const application = await prisma.application.findFirst({
    where: { id, userId: session.user.id },
    include: {
      events: { orderBy: { scheduledAt: "asc" } },
      statusHistory: { orderBy: { changedAt: "desc" } },
      emails: { orderBy: { lastMessageAt: "desc" } },
    },
  });

  if (!application) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(application);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = updateApplicationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Verify ownership
  const existing = await prisma.application.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { status, boardOrder, ...rest } = parsed.data;

  // Status change: log to history
  const statusHistoryCreate =
    status && status !== existing.status
      ? {
          statusHistory: {
            create: {
              fromStatus: existing.status,
              toStatus: status,
            },
          },
        }
      : {};

  // Board order rebalancing: shift other cards in the same column
  if (boardOrder !== undefined && boardOrder !== existing.boardOrder) {
    const newStatus = status || existing.status;
    await prisma.application.updateMany({
      where: {
        userId: session.user.id,
        status: newStatus,
        id: { not: id },
        boardOrder: { gte: boardOrder },
      },
      data: { boardOrder: { increment: 1 } },
    });
  }

  const updated = await prisma.application.update({
    where: { id },
    data: {
      ...rest,
      ...(status && { status }),
      ...(boardOrder !== undefined && { boardOrder }),
      ...statusHistoryCreate,
    },
    include: {
      events: { orderBy: { scheduledAt: "asc" } },
      statusHistory: { orderBy: { changedAt: "desc" } },
      emails: { orderBy: { lastMessageAt: "desc" } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const permanent = searchParams.get("permanent") === "true";

  const existing = await prisma.application.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // If permanent delete is requested OR the application is already withdrawn/archived
  if (permanent || ["WITHDRAWN", "REJECTED", "GHOSTED"].includes(existing.status)) {
    await prisma.application.delete({
      where: { id },
    });
    return NextResponse.json({ success: true, deleted: true });
  }

  // Soft delete — set to WITHDRAWN
  const updated = await prisma.application.update({
    where: { id },
    data: {
      status: "WITHDRAWN",
      statusHistory: {
        create: { fromStatus: existing.status, toStatus: "WITHDRAWN", note: "Archived by user" },
      },
    },
  });

  return NextResponse.json(updated);
}
