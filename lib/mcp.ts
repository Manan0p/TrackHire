// lib/mcp.ts
// Shared helpers for Gmail/Calendar integration (rate limiting, query string, formatters).
// NOTE: "Google Stitch MCP" references have been removed.
// Gmail and Calendar calls now use the Google REST API directly via lib/google-token.ts.

// ─── Rate limiting ────────────────────────────────────────────────────────────

const GMAIL_SYNC_COOLDOWN = 10 * 1000; // 10 seconds cooldown for testing
const lastSyncTimes = new Map<string, number>();

export function canSyncGmail(userId: string): boolean {
  const last = lastSyncTimes.get(userId);
  if (!last) return true;
  return Date.now() - last > GMAIL_SYNC_COOLDOWN;
}

export function markGmailSynced(userId: string): void {
  lastSyncTimes.set(userId, Date.now());
}

export function getNextSyncAllowedAt(userId: string): Date | null {
  const last = lastSyncTimes.get(userId);
  if (!last) return null;
  return new Date(last + GMAIL_SYNC_COOLDOWN);
}

// ─── Gmail search query ───────────────────────────────────────────────────────

export const GMAIL_JOB_QUERY = `(subject:(application OR interview OR assessment OR offer OR "next steps" OR decision OR shortlisted OR selected OR rejected OR "thanks for applying" OR "applied to") OR "application received" OR "interview invite" OR "online assessment" OR "job offer") -subject:("job alert" OR "jobs matching" OR "new jobs" OR "weekly digest" OR "weekly update" OR "your search") newer_than:90d`;

// ─── Calendar helpers ─────────────────────────────────────────────────────────

export function buildCalendarEventTitle(company: string, eventType: string): string {
  return `${company} — ${eventType}`;
}

export function buildCalendarEventDescription(
  role: string,
  jobUrl: string | null | undefined,
  notes: string | null | undefined
): string {
  const parts = [`Role: ${role}`];
  if (jobUrl) parts.push(`Job URL: ${jobUrl}`);
  if (notes) parts.push(`\nNotes:\n${notes}`);
  return parts.join("\n");
}
