import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generatePrepQuestions } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { applicationId } = await req.json();
  if (!applicationId) return NextResponse.json({ error: "applicationId required" }, { status: 400 });

  const application = await prisma.application.findFirst({
    where: { id: applicationId, userId: session.user.id },
  });

  if (!application) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const questions = await generatePrepQuestions(
    application.company,
    application.role,
    application.jobDescription || ""
  );

  return NextResponse.json(questions);
}
