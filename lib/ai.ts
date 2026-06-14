import { google } from "@ai-sdk/google";
import { generateObject, generateText, streamText } from "ai";
import { z } from "zod";

const model = google("gemini-2.0-flash");

// ─── Resume–JD Match Score ─────────────────────────────────────────────────────

export async function scoreResumeMatch(
  resumeText: string,
  jobDescription: string,
  company: string,
  role: string
) {
  const { object } = await generateObject({
    model,
    schema: z.object({
      score: z.number().min(0).max(100),
      matchedSkills: z.array(z.string()),
      missingSkills: z.array(z.string()),
      strengthSummary: z.string(),
      suggestion: z.string(),
    }),
    prompt: `You are an expert tech recruiter and resume evaluator.

Company: ${company}
Role: ${role}

JOB DESCRIPTION:
${jobDescription}

CANDIDATE RESUME:
${resumeText}

Analyze the match between this resume and job description. Return a JSON with:
- score: 0-100 match percentage
- matchedSkills: skills/experience the candidate has that match the JD
- missingSkills: important skills from JD that are missing from resume
- strengthSummary: 2-3 sentence summary of candidate strengths for this role
- suggestion: what to emphasize in the interview to maximize chances`,
  });

  return object;
}

// ─── Interview Prep Questions ──────────────────────────────────────────────────

export async function generatePrepQuestions(
  company: string,
  role: string,
  jobDescription: string
) {
  const { object } = await generateObject({
    model,
    schema: z.object({
      behavioural: z.array(
        z.object({ question: z.string(), hint: z.string() })
      ).length(5),
      technical: z.array(
        z.object({ question: z.string(), hint: z.string() })
      ).length(5),
      companySpecific: z.array(
        z.object({ question: z.string(), hint: z.string() })
      ).length(3),
    }),
    prompt: `You are an expert interview coach specializing in tech roles.

Company: ${company}
Role: ${role}
Job Description: ${jobDescription}

Generate interview preparation questions:
- 5 behavioural questions (STAR format, relevant to this role/company)
- 5 technical questions (based on the JD requirements)
- 3 company-specific questions (about ${company}'s products, culture, strategy)

For each question, provide a brief hint/approach on how to answer it best.`,
  });

  return object;
}

// ─── Follow-up Email Drafter ───────────────────────────────────────────────────

export function streamFollowUpEmail(
  recruiterName: string,
  company: string,
  role: string,
  lastContactDate: string,
  contextNote: string
) {
  return streamText({
    model,
    prompt: `You are a professional career coach helping a candidate write a follow-up email.

Recruiter: ${recruiterName || "Hiring Manager"}
Company: ${company}
Role: ${role}
Last contact: ${lastContactDate}
Context: ${contextNote || "No additional context"}

Write a concise, professional follow-up email. The email should:
- Be 3-4 sentences max
- Express continued interest
- Reference the specific role
- Ask for a status update politely
- Feel human and genuine, not templated
- NOT include a subject line or email headers — just the body

Write only the email body, nothing else.`,
  });
}

// ─── Gmail Email Parser ────────────────────────────────────────────────────────

export async function parseJobEmail(
  subject: string,
  snippet: string,
  senderEmail: string
) {
  const { object } = await generateObject({
    model,
    schema: z.object({
      company: z.string(),
      role: z.string().optional(),
      emailType: z.enum(["confirmation", "interview_invite", "rejection", "offer", "other"]),
      recruiterName: z.string().optional(),
      mentionedDate: z.string().optional(),
      confidence: z.number().min(0).max(1),
    }),
    prompt: `Parse this job application email and extract structured information.

From: ${senderEmail}
Subject: ${subject}
Snippet: ${snippet}

Extract:
- company: the company name (infer from sender domain or subject)
- role: the job title/role if mentioned
- emailType: "confirmation" (application received), "interview_invite", "rejection", "offer", or "other"
- recruiterName: recruiter/HR person's name if mentioned
- mentionedDate: any interview/deadline date mentioned (ISO format if possible)
- confidence: 0-1 how confident you are this is a job application email

If this doesn't seem like a job email, return confidence < 0.3.`,
  });

  return object;
}

// ─── Generate AI Notes ────────────────────────────────────────────────────────

export async function generateApplicationSummary(
  company: string,
  role: string,
  notes: string,
  jobDescription: string
) {
  const { text } = await generateText({
    model,
    prompt: `Summarize the key information about this job application in 2-3 bullet points for quick reference.

Company: ${company}
Role: ${role}
Notes: ${notes || "None"}
Job Description excerpt: ${jobDescription?.slice(0, 500) || "Not provided"}

Be concise and actionable.`,
  });

  return text;
}
