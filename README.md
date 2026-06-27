# TrackHire: AI-Powered Job Application Sanctuary

TrackHire is a comprehensive, modern job search organization platform designed for job seekers. It organizes your pipeline, syncs seamlessly with your Gmail and Google Calendar, and uses Google Generative AI to analyze job descriptions, score resume relevance, draft follow-up emails, and generate tailored interview prep questions.

🌐 **Live Demo:** [https://trackhire.vercel.app/](https://trackhire.vercel.app/)

---

## 🖼️ Product Tour

Here’s a quick look at the app experience — from the central pipeline board to the structured resume builder.

**Interactive Kanban Board**
A dynamic drag-and-drop board tracking applications through stages: Wishlist, Applied, Assessment, HR, Technical, and Offer.

**Tabular List View**
A unified tabular layout containing full filtering, search, sorting, and instant CSV exports of all job tracking data.

**Profile Hub & Structured Resume Builder**
Interactive resume manager holding professional summaries, dynamic skill parsing, experience bullet highlights, education GPAs, and project highlights that auto-compiles to plain text for AI ingestion.

**AI Career Assistant Pane**
Real-time analysis drawer providing instant match scores, missing skill alerts, tailored behavioral/technical interview prep questions, and custom follow-up email drafts.

**Chrome Extension Web Clipper**
1-click job tracking extension that scrapes LinkedIn job postings and automatically syncs the application directly into your TrackHire pipeline via a custom developer API.

---

## 🎯 What This Project Does

TrackHire is built around unifying the chaotic job application workflow into a single continuous stream: source logging → live tracking → email/calendar automation → AI-powered application optimization.

It helps job seekers to:
- **Visualize the Pipeline:** Drag-and-drop card movements to keep track of interviews and deadlines.
- **Ditch the Spreadsheet:** Search, filter, and export applications instantly to CSV.
- **Automate Calendar Invites:** Create Google Calendar events directly from the dashboard timeline.
- **Sync with Gmail:** Automatically parse incoming job confirmations, interview requests, and update statuses.
- **Leverage AI Insights:** Upload structured resume details once, and get custom feedback and interview prep materials per job description.

---

## ✨ Core Features

- 🔐 **Google OAuth Authentication** - next-auth v5 powered sign-in ensuring secure, verified user sessions.
- 📋 **Dynamic Kanban Board** - Fluid drag-and-drop columns utilizing `@dnd-kit` to transition applications through interview stages.
- 💬 **AI Match Scoring & Feedback** - Live score matching that evaluates resumes against job descriptions to highlight strengths and identify missing skills.
- 📝 **Structured Resume Builder** - Clean forms to build a professional profile, with comma-separated live skill chip parsing, experience bulletins, and project highlight inputs.
- 📅 **Google Calendar Integration** - Schedule interviews, OAs, or follow-ups with automatic calendar event generation.
- 📧 **Gmail Smart Detection** - Scan linked mailboxes to auto-resolve application receipts, interview requests, and status changes.
- 📥 **Dedicated Job Inbox** - A specialized UI filtering job-related emails explicitly for manual triaging and one-click application creation without AI drops.
- 🧩 **Chrome Web Clipper** - A dedicated Chrome extension providing 1-click tracking from LinkedIn jobs directly into your dashboard.
- 🔑 **Developer API Keys** - Generate secure API keys to integrate custom workflows and authenticate external browser extensions.
- 🤖 **Tailored Interview Prep** - Dynamically generates behavioral, technical, and company-specific questions matching the job description.
- ✉️ **Contextual Email Drafter** - Instantly drafts follow-up emails for recruiters based on the latest application updates.

---

## 👥 Who Is This For?

Perfect for learning and building:
- **Full-stack Next.js:** App Router, robust server APIs, complex route groups, and folder structuring.
- **State Management & DnD**: Complex drag-and-drop state updates with optimistic UI rollback capabilities.
- **AI-Driven Workflows:** Utilizing the Google Generative AI SDK (`@ai-sdk/google` & Gemini Pro) for document parsing, semantic scoring, and question generation.
- **OAuth & API Integrations**: Google Cloud integration spanning Calendar API, Gmail API, and OAuth scope management.
- **Premium CSS/UI Design**: Pure CSS-in-JS style tokens, glassmorphic headers, and clean micro-interactions without third-party styling bloat.

---

## 🛠 Tech Stack

**Frontend**
- **Next.js 16.2** - App Router (Server Components & API Route Handlers)
- **React 19** - UI library
- **Tailwind CSS v4** - Styling framework
- **Base UI & Radix UI** - Accessible component primitives
- **Lucide React** - Iconography
- **Recharts** - Dynamic analytics charting

**Backend & Services**
- **Prisma** - ORM for database modeling and schema management
- **Neon PostgreSQL** - Serverless Postgres database
- **Google Generative AI** - Smart match scoring, prep question compiler, and email drafter
- **NextAuth.js v5** - Google OAuth authentication and session handling

**Deployment**
- **Vercel** - Hosting, serverless functions, and CI/CD pipelines
- **Google Cloud Platform (GCP)** - Google APIs, OAuth Consent Screen, and domain routing

---

## 📁 Project Structure

```text
trackhire/
├── app/
│   ├── api/                  # API endpoints (applications, events, profile, gmail)
│   ├── (auth)/               # Login, registering, and auth layouts
│   ├── (dashboard)/          # Dashboard views (board, list, profile, settings, analytics)
│   ├── page.tsx              # Landing page
│   └── layout.tsx            # Global layout wrapper
├── chrome-extension/         # Chrome Extension Web Clipper for 1-click LinkedIn tracking
├── components/               # Reusable UI pieces (board, applications, ai, layout, ui)
├── lib/                      # Core helpers (auth, prisma, resume-compiler, ai)
├── prisma/                   # Schema definitions and database push logs
├── types/                    # TypeScript interfaces
├── public/                   # Static assets & icons
└── package.json              # App dependencies
```

---

## 🚀 Quick Start

### 1) Prerequisites
- Node.js 20+
- npm (or yarn/pnpm)
- A PostgreSQL database (Neon suggested)
- Google Gemini API Key
- Google Cloud Console Developer Credentials (OAuth Client ID)

### 2) Install dependencies
```bash
npm install
```

### 3) Environment variables
Create a `.env` file in the root directory:

```env
# NextAuth Settings
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_string

# Google OAuth Credentials
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# AI Settings
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key

# Database Settings
DATABASE_URL="postgresql://user:password@ep-host.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

### 4) Database Sync
Push the prisma schema to your database instance:
```bash
npx prisma db push
npx prisma generate
```

### 5) Start the dev server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 💾 Database Schema Overview

TrackHire utilizes a relational schema mapping users, applications, and calendar schedules:
- `User` - User profile storing OAuth fields, default cover letter template, structured resume JSON (`resumeData`), and developer `apiKey`.
- `Application` - Job tracking data (company, role, source, status, matchScore, appliedAt, notes).
- `Event` - Dynamic calendar logs linked to applications (interview types, scheduled date/time, notes, completion).
- `StatusHistory` - Auto-created log tracking application status transitions for analytics.
- `EmailThread` - Keeps track of mapped Gmail threads for auto-sync validation.

---

## 📊 How It Works (End-to-End)

1. User authenticates via Google OAuth, granting access to Gmail/Calendar scopes if requested.
2. The user builds their structured profile once in the **Profile** hub. Saving compiles the JSON data into raw markdown text (`User.resumeText`).
3. When tracking a job description, clicking **Match Score** triggers the backend AI client. It compares the job description against `User.resumeText` via Gemini Pro, returning JSON containing scores and missing skills.
4. Adding an Interview Event calls the Google Calendar API securely on behalf of the user, posting an event block and linking the `calendarEventId` back to the database.
5. Gmail Sync fetches headers and snippets matching the tracked company. If matched, it prompts the user to update their board status or logs updates automatically.

---

## 🐛 Troubleshooting

| Issue | Likely Cause | Fix |
| :--- | :--- | :--- |
| **Google Auth redirect mismatch** | Mismatched callback URLs on GCP | Add `https://your-domain.vercel.app/api/auth/callback/google` to redirect URIs in GCP. |
| **Auth block / "Blocked App" error** | Test user list is empty in GCP testing | Add your sign-in email address to the GCP OAuth Consent Screen "Test Users" list. |
| **AI Matching yields 0% scores** | Empty resume data or empty job desc | Fill in the Resume Builder summary, skills, and experience tabs fully. |
| **Database connection timeouts** | Neon pooled vs unpooled connection limit | Verify you are using pooled settings or append `?sslmode=require` in Neon. |

---

## 🚢 Building for Production

```bash
npm run build
npm run start
```

## 📝 Scripts

- `npm run dev` - Start Next.js development server
- `npm run build` - Build the application for production
- `npm run start` - Start production built instance
- `npm run lint` - Run ESLint checks

---

## 🔐 Security Notes

⚠️ **For production:**
- **OAuth Scopes:** Ensure your GCP application requests *only* the minimum required scopes (`gmail.readonly`, `calendar.events`).
- **Secret Keys:** Never prefix server-only keys (like `GOOGLE_CLIENT_SECRET` or `GOOGLE_GENERATIVE_AI_API_KEY`) with `NEXT_PUBLIC_` to keep them securely hidden from client bundles.
- Ensure the production callback points to the secure `https` protocol in Vercel.

---

## 🤝 Contributing
Contributions are welcome! Feel free to open an issue or submit a Pull Request.

## 📝 License
This project is licensed under the MIT License - see the `LICENSE` file for details.

Copyright © 2026 Manan

## 👨‍💻 Authors
Built by **Manan** (GitHub: [Manan0p](https://github.com/Manan0p)).

## 🙏 Acknowledgments
- **Prisma** and **Neon** for top-tier database management.
- **Google Generative AI** for powering resume parsing and matching metrics.
- **Vercel** for lightning-fast deployments.
- **Base UI** and **Radix UI** for accessible layout skeletons.
