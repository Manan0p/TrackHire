import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scoreResumeMatch } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { applicationId } = await req.json();
  if (!applicationId) return NextResponse.json({ error: "applicationId required" }, { status: 400 });

  const [application, user] = await Promise.all([
    prisma.application.findFirst({
      where: { id: applicationId, userId: session.user.id },
    }),
    prisma.user.findUnique({ where: { id: session.user.id } }),
  ]);

  if (!application) return NextResponse.json({ error: "Application not found" }, { status: 404 });

  if (!user?.resumeText) {
    return NextResponse.json(
      { error: "Please add your resume text in Settings first" },
      { status: 400 }
    );
  }

  if (!application.jobDescription) {
    return NextResponse.json(
      { error: "Please add the job description to this application first" },
      { status: 400 }
    );
  }

  const result = await scoreResumeMatch(
    user.resumeText,
    application.jobDescription,
    application.company,
    application.role
  );

  // Save back to application
  await prisma.application.update({
    where: { id: applicationId },
    data: {
      matchScore: result.score,
      aiNotes: `Matched: ${result.matchedSkills.join(", ")}\nMissing: ${result.missingSkills.join(", ")}\n\n${result.strengthSummary}`,
    },
  });

  return NextResponse.json(result);
}
