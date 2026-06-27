import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { apiKey: true },
  });

  return NextResponse.json({ apiKey: user?.apiKey || null });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Generate a secure random string for the API key (prefix with th_ for TrackHire)
  const newApiKey = "th_" + crypto.randomBytes(24).toString("hex");

  const updatedUser = await prisma.user.update({
    where: { id: session.user.id },
    data: { apiKey: newApiKey },
    select: { apiKey: true },
  });

  return NextResponse.json({ apiKey: updatedUser.apiKey });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { apiKey: null },
  });

  return NextResponse.json({ success: true });
}
