import { AppStatus, Source, EventType } from "@prisma/client";

// ─── Resume Builder Types ─────────────────────────────────────────────────────

export type ResumeExperience = {
  id: string;
  company: string;
  title: string;
  from: string;
  to: string;
  current: boolean;
  bullets: string[];
};

export type ResumeEducation = {
  id: string;
  school: string;
  degree: string;
  field: string;
  from: string;
  to: string;
};

export type ResumeProject = {
  id: string;
  name: string;
  url: string;
  description: string;
  tech: string[];
};

export type ResumeData = {
  summary: string;
  skills: string[];
  experience: ResumeExperience[];
  education: ResumeEducation[];
  projects: ResumeProject[];
  certifications: string[];
};

// ─── Status Display ───────────────────────────────────────────────────────────

export const STATUS_LABELS: Record<AppStatus, string> = {
  WISHLIST: "Wishlist",
  APPLIED: "Applied",
  OA: "Online Assessment",
  PHONE: "Phone Screen",
  TECHNICAL: "Technical",
  FINAL: "Final Round",
  OFFER: "Offer",
  REJECTED: "Rejected",
  GHOSTED: "Ghosted",
  WITHDRAWN: "Withdrawn",
};

export const STATUS_COLORS: Record<AppStatus, string> = {
  WISHLIST: "#6B7280",
  APPLIED: "#3B82F6",
  OA: "#8B5CF6",
  PHONE: "#0EA5E9",
  TECHNICAL: "#F59E0B",
  FINAL: "#EF4444",
  OFFER: "#10B981",
  REJECTED: "#F43F5E",
  GHOSTED: "#94A3B8",
  WITHDRAWN: "#A8A29E",
};

export const STATUS_BG: Record<AppStatus, string> = {
  WISHLIST: "bg-gray-100 text-gray-700",
  APPLIED: "bg-blue-100 text-blue-700",
  OA: "bg-purple-100 text-purple-700",
  PHONE: "bg-sky-100 text-sky-700",
  TECHNICAL: "bg-amber-100 text-amber-700",
  FINAL: "bg-red-100 text-red-700",
  OFFER: "bg-green-100 text-green-700",
  REJECTED: "bg-rose-100 text-rose-700",
  GHOSTED: "bg-slate-100 text-slate-600",
  WITHDRAWN: "bg-stone-100 text-stone-600",
};

// ─── Source Display ───────────────────────────────────────────────────────────

export const SOURCE_LABELS: Record<Source, string> = {
  LINKEDIN: "LinkedIn",
  WELLFOUND: "Wellfound",
  EMAIL: "Email",
  COMPANY_PORTAL: "Company Portal",
  REFERRAL: "Referral",
  OTHER: "Other",
};

export const SOURCE_COLORS: Record<Source, string> = {
  LINKEDIN: "#0077B5",
  WELLFOUND: "#F36F21",
  EMAIL: "#10B981",
  COMPANY_PORTAL: "#6B7280",
  REFERRAL: "#8B5CF6",
  OTHER: "#9CA3AF",
};

// ─── Event Type Display ───────────────────────────────────────────────────────

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  OA_DEADLINE: "OA Deadline",
  PHONE_SCREEN: "Phone Screen",
  TECHNICAL_INTERVIEW: "Technical Interview",
  SYSTEM_DESIGN: "System Design",
  FINAL_ROUND: "Final Round",
  HR_ROUND: "HR Round",
  OFFER_DEADLINE: "Offer Deadline",
  FOLLOWUP_DUE: "Follow-up Due",
  OTHER: "Other",
};

export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  OA_DEADLINE: "#8B5CF6",
  PHONE_SCREEN: "#3B82F6",
  TECHNICAL_INTERVIEW: "#F59E0B",
  SYSTEM_DESIGN: "#F59E0B",
  FINAL_ROUND: "#EF4444",
  HR_ROUND: "#0EA5E9",
  OFFER_DEADLINE: "#F59E0B",
  FOLLOWUP_DUE: "#6B7280",
  OTHER: "#9CA3AF",
};

// ─── Kanban columns ───────────────────────────────────────────────────────────

export const KANBAN_COLUMNS: AppStatus[] = [
  "WISHLIST",
  "APPLIED",
  "OA",
  "PHONE",
  "TECHNICAL",
  "FINAL",
  "OFFER",
];

export const ARCHIVED_COLUMNS: AppStatus[] = ["REJECTED", "GHOSTED", "WITHDRAWN"];

// ─── Utility types ────────────────────────────────────────────────────────────

export type ApplicationWithRelations = {
  id: string;
  userId: string;
  company: string;
  role: string;
  jobUrl: string | null;
  jobDescription: string | null;
  source: Source;
  status: AppStatus;
  recruiterName: string | null;
  recruiterEmail: string | null;
  recruiterLinkedIn: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  equity: string | null;
  appliedAt: Date | null;
  resumeVersion: string | null;
  coverLetter: boolean;
  referral: boolean;
  referralName: string | null;
  notes: string | null;
  tags: string[];
  matchScore: number | null;
  aiNotes: string | null;
  gmailThreadId: string | null;
  calendarEventId: string | null;
  boardOrder: number;
  createdAt: Date;
  updatedAt: Date;
  events: EventRecord[];
  statusHistory: StatusHistoryRecord[];
  emails: EmailThreadRecord[];
};

export type EventRecord = {
  id: string;
  applicationId: string;
  type: EventType;
  title: string;
  scheduledAt: Date;
  durationMins: number | null;
  location: string | null;
  notes: string | null;
  completed: boolean;
  calendarEventId: string | null;
  createdAt: Date;
};

export type StatusHistoryRecord = {
  id: string;
  applicationId: string;
  fromStatus: AppStatus | null;
  toStatus: AppStatus;
  changedAt: Date;
  note: string | null;
};

export type EmailThreadRecord = {
  id: string;
  applicationId: string;
  gmailThreadId: string;
  subject: string;
  snippet: string | null;
  lastMessageAt: Date;
  messageCount: number;
  fromEmail: string | null;
  createdAt: Date;
};

export type MatchScoreResult = {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  strengthSummary: string;
  suggestion: string;
};

export type PrepQuestion = {
  question: string;
  hint: string;
};

export type PrepQuestionsResult = {
  behavioural: PrepQuestion[];
  technical: PrepQuestion[];
  companySpecific: PrepQuestion[];
};

export type GmailSyncResult = {
  detected: DetectedApplication[];
  matched: string[];
  errors: string[];
};

export type DetectedApplication = {
  company: string;
  role: string;
  emailType: "confirmation" | "interview_invite" | "rejection" | "offer" | "other";
  recruiterName?: string;
  recruiterEmail?: string;
  mentionedDate?: string;
  threadId: string;
  subject: string;
  snippet: string;
  existingApplicationId?: string;
};
