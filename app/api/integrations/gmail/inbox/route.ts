import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getValidAccessToken } from "@/lib/google-token";
import { GMAIL_JOB_QUERY } from "@/lib/mcp";

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

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const userEmail = session.user.email?.toLowerCase();

  let accessToken: string;
  try {
    accessToken = await getValidAccessToken(userId);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Token error";
    return NextResponse.json({ error: message, needsReauth: true }, { status: 401 });
  }

  const headers = { Authorization: `Bearer ${accessToken}` };

  // 1. List matching messages (slightly broader query for Inbox to ensure we don't miss anything)
  const broaderQuery = `${GMAIL_JOB_QUERY} OR subject:interview OR subject:application OR subject:offer`;
  const listUrl = `${GMAIL_API}/messages?q=${encodeURIComponent(broaderQuery)}&maxResults=50`;
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
    return NextResponse.json({ threads: [] });
  }

  // 2. Get unique thread IDs
  const threadIds = [...new Set(messageRefs.map((m) => m.threadId))].slice(0, 30);

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

  // 4. Get existing threads to see if they are already linked
  const existingEmailThreads = await prisma.emailThread.findMany({
    where: {
      id: { in: threadIds },
      application: { userId },
    },
    select: { id: true, applicationId: true },
  });

  const linkedThreadIds = new Set(existingEmailThreads.map((t) => t.id));

  const result = [];
  for (const thread of threads) {
    const firstMsg = thread.messages[0];
    if (!firstMsg) continue;

    let targetMsg = thread.messages[thread.messages.length - 1];
    for (let i = thread.messages.length - 1; i >= 0; i--) {
      const msgFrom = getHeader(thread.messages[i], "From").toLowerCase();
      if (userEmail && !msgFrom.includes(userEmail)) {
        targetMsg = thread.messages[i];
        break;
      }
    }

    const subject = getHeader(firstMsg, "Subject") || "(No Subject)";
    const from = getHeader(targetMsg, "From") || "Unknown Sender";
    const dateStr = getHeader(targetMsg, "Date");
    const date = dateStr ? new Date(dateStr).toISOString() : new Date().toISOString();
    const snippet = targetMsg.snippet ?? "";

    const fromEmailMatch = from.match(/<([^>]+)>/);
    const fromEmail = fromEmailMatch?.[1] ?? from;
    const fromName = from.split("<")[0].trim() || fromEmail;

    result.push({
      threadId: thread.id,
      subject,
      fromEmail,
      fromName,
      date,
      snippet,
      isLinked: linkedThreadIds.has(thread.id),
    });
  }
  
  // Sort by date descending
  result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return NextResponse.json({ threads: result });
}
