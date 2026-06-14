import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "TrackHire - Job Application Tracker",
    template: "%s | TrackHire",
  },
  description:
    "Track every job application, interview, and offer in one unified dashboard. Built for serious tech job seekers.",
  keywords: ["job tracker", "interview tracker", "job application", "career", "tech jobs"],
  openGraph: {
    title: "TrackHire",
    description: "Your intelligent job search command center",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body
        className="bg-[var(--background)] font-sans text-[var(--foreground)] antialiased"
        suppressHydrationWarning
      >
        <Providers>
          <TooltipProvider>{children}</TooltipProvider>
        </Providers>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
