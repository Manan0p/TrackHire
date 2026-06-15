import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { compileResumeData } from "@/lib/resume-compiler";
import type { ResumeData } from "@/types";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      headline: true,
      linkedinUrl: true,
      githubUrl: true,
      portfolioUrl: true,
      resumeText: true,
      resumeData: true,
      coverLetter: true,
      gmailConnected: true,
      calendarId: true,
    },
  });

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    name,
    headline,
    linkedinUrl,
    githubUrl,
    portfolioUrl,
    resumeText,
    resumeData,
    coverLetter,
    gmailConnected,
    calendarId,
  } = body;

  // If resumeData is being updated, compile it to resumeText automatically
  let compiledResumeText: string | undefined;
  if (resumeData !== undefined) {
    compiledResumeText = compileResumeData(resumeData as ResumeData);
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(name !== undefined && { name }),
      ...(headline !== undefined && { headline }),
      ...(linkedinUrl !== undefined && { linkedinUrl }),
      ...(githubUrl !== undefined && { githubUrl }),
      ...(portfolioUrl !== undefined && { portfolioUrl }),
      ...(resumeText !== undefined && { resumeText }),
      ...(resumeData !== undefined && {
        resumeData,
        resumeText: compiledResumeText,
      }),
      ...(coverLetter !== undefined && { coverLetter }),
      ...(gmailConnected !== undefined && { gmailConnected }),
      ...(calendarId !== undefined && { calendarId }),
    },
  });

  return NextResponse.json(user);
}
