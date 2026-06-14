import { z } from "zod";
import { Source, AppStatus, EventType } from "@prisma/client";

// ─── Application Validators ───────────────────────────────────────────────────

export const createApplicationSchema = z.object({
  company: z.string().min(1, "Company name is required"),
  role: z.string().min(1, "Role is required"),
  jobUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  jobDescription: z.string().optional(),
  source: z.nativeEnum(Source),
  status: z.nativeEnum(AppStatus).default("APPLIED"),
  recruiterName: z.string().optional(),
  recruiterEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  recruiterLinkedIn: z.string().optional(),
  salaryMin: z.number().int().min(0).optional(),
  salaryMax: z.number().int().min(0).optional(),
  currency: z.string().default("INR"),
  equity: z.string().optional(),
  appliedAt: z.coerce.date().optional(),
  resumeVersion: z.string().optional(),
  coverLetter: z.boolean().default(false),
  referral: z.boolean().default(false),
  referralName: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  boardOrder: z.number().int().default(0),
});

export const updateApplicationSchema = createApplicationSchema.partial().extend({
  matchScore: z.number().int().min(0).max(100).optional(),
  aiNotes: z.string().optional(),
  gmailThreadId: z.string().optional(),
  calendarEventId: z.string().optional(),
});

// ─── Event Validators ──────────────────────────────────────────────────────────

export const createEventSchema = z.object({
  type: z.nativeEnum(EventType),
  title: z.string().min(1, "Event title is required"),
  scheduledAt: z.coerce.date(),
  durationMins: z.number().int().min(1).optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
  completed: z.boolean().default(false),
});

export const updateEventSchema = createEventSchema.partial();

// ─── User Validators ───────────────────────────────────────────────────────────

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  resumeText: z.string().optional(),
  gmailConnected: z.boolean().optional(),
  calendarId: z.string().optional(),
});

// ─── AI Validators ────────────────────────────────────────────────────────────

export const matchScoreSchema = z.object({
  applicationId: z.string().cuid(),
});

export const prepQuestionsSchema = z.object({
  applicationId: z.string().cuid(),
});

export const followUpSchema = z.object({
  applicationId: z.string().cuid(),
  contextNote: z.string().optional(),
});

// ─── Pagination ───────────────────────────────────────────────────────────────

export const listApplicationsSchema = z.object({
  status: z.nativeEnum(AppStatus).optional(),
  source: z.nativeEnum(Source).optional(),
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type ListApplicationsInput = z.infer<typeof listApplicationsSchema>;
