"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Loader2, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleGoogle = async () => {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/board" });
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setEmailLoading(true);
    try {
      const result = await signIn("resend", { email, redirect: false, callbackUrl: "/board" });
      if (result?.ok) {
        setEmailSent(true);
        toast.success("Check your email for a login link!");
      } else {
        toast.error("Failed to send login link");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-6 text-[var(--foreground)] antialiased"
      style={{
        backgroundImage: "radial-gradient(circle at 50% 0%, var(--surface-panel), var(--background) 60%)",
      }}
      suppressHydrationWarning
    >
      <main className="w-full max-w-[390px] bg-white rounded-xl shadow-md border border-[var(--border)] p-8 flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex items-baseline gap-[3px] mb-4 select-none">
            <span className="text-[24px] font-bold tracking-tight text-[var(--foreground)]">TrackHire</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary-container)] inline-block"></span>
          </div>
          <h1 className="text-[17px] font-semibold text-[var(--foreground)] mb-1">Welcome back</h1>
          <p className="text-[12px] text-[var(--text-muted)]">Track your career growth.</p>
        </div>

        {emailSent ? (
          <div className="text-center space-y-4 py-4">
            <div className="w-12 h-12 bg-[var(--primary-light)] text-[var(--primary)] rounded-full flex items-center justify-center mx-auto border border-[var(--primary-light)]">
              <Mail className="w-5 h-5" />
            </div>
            <p className="font-semibold text-[14px]">Check your inbox</p>
            <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
              We sent a magic login link to <br />
              <strong className="text-[var(--foreground)]">{email}</strong>
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {/* Google Provider Button */}
            <Button
              className="w-full h-[40px] flex items-center justify-center gap-2 border border-[var(--border)] rounded bg-white hover:bg-slate-50 transition-colors duration-150 text-[var(--foreground)] text-[12px] font-medium shadow-sm"
              onClick={handleGoogle}
              disabled={googleLoading}
              type="button"
            >
              {googleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-[var(--primary)]" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                </svg>
              )}
              Continue with Google
            </Button>

            {/* Divider */}
            <div className="relative flex items-center">
              <div className="flex-grow border-t border-[var(--border)]"></div>
              <span className="flex-shrink-0 mx-3 text-[10px] text-[var(--text-subtle)] font-semibold uppercase tracking-wider">or</span>
              <div className="flex-grow border-t border-[var(--border)]"></div>
            </div>

            {/* Email Magic Link Form */}
            <form onSubmit={handleEmailSignIn} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-[12px] font-semibold text-[var(--text-muted)]" htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded text-[13px] text-[var(--foreground)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-container)]/10 focus:border-[var(--primary-container)] transition-all shadow-sm h-10"
                />
              </div>

              <Button
                className="w-full mt-2 h-10 flex items-center justify-center bg-[var(--primary)] hover:bg-[var(--primary-container)] text-white font-semibold text-[13px] rounded transition-all duration-150 shadow-sm active:scale-[0.98] gap-1.5"
                type="submit"
                disabled={emailLoading || !email}
              >
                {emailLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <ArrowRight className="w-4 h-4 text-white" strokeWidth={2.5} />
                )}
                Email Magic Link
              </Button>
            </form>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-[11px] text-[var(--text-muted)] leading-relaxed pt-4 border-t border-[var(--border)]/50">
          By signing in, you agree to our terms of service and privacy policy.
        </p>
      </main>
    </div>
  );
}
