import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);
const FROM = process.env.RESEND_FROM_EMAIL || "noreply@trackhire.app";

export async function sendWelcomeEmail(to: string, name: string) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: "Welcome to TrackHire 🎯",
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; color: #111827;">
        <h1 style="font-size: 24px; font-weight: 700; color: #0F6E56; margin-bottom: 8px;">Welcome to TrackHire</h1>
        <p style="font-size: 16px; color: #6B7280; margin-bottom: 24px;">Hi ${name || "there"}, your job search just got a whole lot smarter.</p>
        <p style="font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
          Start by adding your first application — paste the job description and let our AI score your resume match. 
          Then connect Gmail to automatically detect new applications from your inbox.
        </p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/board" 
           style="display: inline-block; background: #0F6E56; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
          Open TrackHire →
        </a>
      </div>
    `,
  });
}

export async function sendReminderEmail(
  to: string,
  name: string,
  reminders: Array<{ type: string; title: string; company: string; date?: string }>
) {
  const items = reminders
    .map(
      (r) =>
        `<li style="margin-bottom: 8px; padding: 12px; background: #F9FAFB; border-radius: 6px; border-left: 3px solid #0F6E56;">
          <strong style="color: #111827;">${r.company}</strong> — ${r.title}
          ${r.date ? `<span style="color: #6B7280; font-size: 13px; display: block; margin-top: 2px;">${r.date}</span>` : ""}
        </li>`
    )
    .join("");

  return resend.emails.send({
    from: FROM,
    to,
    subject: `TrackHire: ${reminders.length} reminder${reminders.length > 1 ? "s" : ""} for today`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; color: #111827;">
        <h1 style="font-size: 20px; font-weight: 700; color: #0F6E56; margin-bottom: 4px;">Good morning, ${name || "there"} 👋</h1>
        <p style="font-size: 14px; color: #6B7280; margin-bottom: 24px;">Here's your job search update for today.</p>
        <ul style="list-style: none; padding: 0; margin: 0 0 24px 0;">${items}</ul>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/board" 
           style="display: inline-block; background: #0F6E56; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
          View Dashboard →
        </a>
        <p style="font-size: 12px; color: #9CA3AF; margin-top: 32px;">
          You're receiving this because you have email reminders enabled in TrackHire settings.
        </p>
      </div>
    `,
  });
}

export { resend };
