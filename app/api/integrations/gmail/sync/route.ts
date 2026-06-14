import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseJobEmail } from "@/lib/ai";
import { getValidAccessToken } from "@/lib/google-token";
import { canSyncGmail, markGmailSynced, GMAIL_JOB_QUERY } from "@/lib/mcp";
import type { DetectedApplication } from "@/types";

const GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me";

interface GmailMessageHeader { name: string; value: string; }
interface GmailMessagePart { headers: GmailMessageHeader[]; snippet?: string; }
interface GmailMessage { id: string; threadId: string; snippet: string; payload?: GmailMessagePart; }
interface GmailThread { id: string; messages: GmailMessage[]; }
interface GmailListResponse { messages?: Array<{ id: string; threadId: string }>; }

function getHeader(msg: GmailMessage, name: string): string {
  return msg.payload?.headers?.find(
    (h) => h.name.toLowerCase() === name.toLowerCase()
  )?.value ?? "";
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  if (!canSyncGmail(userId)) {
    return NextResponse.json(
      { error: "Gmail sync is rate-limited to once every 15 minutes." },
      { status: 429 }
    );
  }

  // Get a fresh access token (auto-refreshes if expired)
  let accessToken: string;
  try {
    accessToken = await getValidAccessToken(userId);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Token error";
    return NextResponse.json({ error: message }, { status: 401 });
  }

  const headers = { Authorization: `Bearer ${accessToken}` };

  // 1. List matching messages
  const listUrl = `${GMAIL_API}/messages?q=${encodeURIComponent(GMAIL_JOB_QUERY)}&maxResults=50`;
  const listRes = await fetch(listUrl, { headers });
  if (!listRes.ok) {
    return NextResponse.json(
      { error: "Gmail API error listing messages", details: await listRes.text() },
      { status: 502 }
    );
  }
  const listData = (await listRes.json()) as GmailListResponse;
  const messageRefs = listData.messages ?? [];

  if (messageRefs.length === 0) {
    markGmailSynced(userId);
    await prisma.user.update({ where: { id: userId }, data: { gmailConnected: true } });
    return NextResponse.json({ detected: [], errors: [], synced: 0 });
  }

  // 2. Get unique thread IDs (deduplicate)
  const threadIds = [...new Set(messageRefs.map((m) => m.threadId))].slice(0, 20);

  // 3. Fetch each thread
  const threads: GmailThread[] = [];
  await Promise.allSettled(
    threadIds.map(async (threadId) => {
      const res = await fetch(`${GMAIL_API}/threads/${threadId}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`, { headers });
      if (res.ok) {
        threads.push((await res.json()) as GmailThread);
      }
    })
  );

  markGmailSynced(userId);
  await prisma.user.update({ where: { id: userId }, data: { gmailConnected: true } });

  // 4. Get existing applications for fuzzy matching
  const existingApps = await prisma.application.findMany({
    where: { userId },
    select: { id: true, company: true },
  });

  const detected: DetectedApplication[] = [];
  const errors: string[] = [];

  for (const thread of threads) {
    try {
      const firstMsg = thread.messages[0];
      const lastMsg = thread.messages[thread.messages.length - 1];
      if (!firstMsg) continue;

      const subject = getHeader(firstMsg, "Subject");
      const from = getHeader(firstMsg, "From");
      const date = getHeader(lastMsg, "Date");
      const snippet = lastMsg.snippet ?? "";

      // Extract email address from "Name <email>" format
      const fromEmailMatch = from.match(/<([^>]+)>/);
      const fromEmail = fromEmailMatch?.[1] ?? from;

      const parsed = await parseJobEmail(subject, snippet, fromEmail);
      if (parsed.confidence < 0.3) continue;

      const matchedApp = existingApps.find(
        (app) =>
          app.company.toLowerCase().includes(parsed.company.toLowerCase()) ||
          parsed.company.toLowerCase().includes(app.company.toLowerCase())
      );

      detected.push({
        company: parsed.company,
        role: parsed.role || "Unknown Role",
        emailType: parsed.emailType,
        recruiterName: parsed.recruiterName,
        mentionedDate: parsed.mentionedDate,
        threadId: thread.id,
        subject,
        snippet,
        existingApplicationId: matchedApp?.id,
      });

      if (matchedApp) {
        await prisma.emailThread.upsert({
          where: { id: thread.id },
          update: {
            lastMessageAt: date ? new Date(date) : new Date(),
            snippet,
          },
          create: {
            id: thread.id,
            applicationId: matchedApp.id,
            gmailThreadId: thread.id,
            subject,
            snippet,
            lastMessageAt: date ? new Date(date) : new Date(),
            fromEmail,
          },
        });
      }
    } catch (err) {
      errors.push(`Thread ${thread.id}: ${err}`);
    }
  }

  return NextResponse.json({
    detected,
    errors,
    synced: threads.length,
    query: GMAIL_JOB_QUERY,
  });
}

export async function GET() {
  return NextResponse.json({ query: GMAIL_JOB_QUERY });
}
