import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { streamFollowUpEmail } from "@/lib/ai";
import { format } from "date-fns";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { applicationId, contextNote } = await req.json();

  const application = await prisma.application.findFirst({
    where: { id: applicationId, userId: session.user.id },
    include: { statusHistory: { orderBy: { changedAt: "desc" }, take: 1 } },
  });

  if (!application) return new Response("Not found", { status: 404 });

  const lastContact = application.statusHistory[0]?.changedAt
    ? format(application.statusHistory[0].changedAt, "MMMM d, yyyy")
    : application.appliedAt
    ? format(application.appliedAt, "MMMM d, yyyy")
    : "recently";

  const result = streamFollowUpEmail(
    application.recruiterName || "",
    application.company,
    application.role,
    lastContact,
    contextNote || ""
  );

  return result.toTextStreamResponse();
}
