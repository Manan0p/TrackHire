"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  const handleGoogle = async () => {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/board" });
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setEmailLoading(true);
    try {
      const result = await signIn("resend", { email, redirect: false, callbackUrl: "/board" });
      if (result?.ok) {
        toast.success("Magic link sent! Check your inbox.");
      } else {
        toast.error("Failed to send magic link");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div
      suppressHydrationWarning
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      {/* Card */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #E5E7EB",
          borderRadius: "12px",
          padding: "40px 36px",
          width: "100%",
          maxWidth: "400px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ display: "inline-flex", alignItems: "baseline", gap: "2px", marginBottom: "20px" }}>
            <span style={{ fontSize: "22px", fontWeight: 700, letterSpacing: "-0.02em", color: "#111827" }}>
              TrackHire
            </span>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#0D9488", display: "inline-block", marginBottom: "2px" }} />
          </div>
          <h1 style={{ fontSize: "17px", fontWeight: 600, color: "#111827", margin: "0 0 6px" }}>
            Welcome back
          </h1>
          <p style={{ fontSize: "13px", color: "#6B7280", margin: 0 }}>
            Track your career growth.
          </p>
        </div>

        {/* Google Button */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={googleLoading}
          style={{
            width: "100%",
            height: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            border: "1px solid #D1D5DB",
            borderRadius: "8px",
            background: "#ffffff",
            cursor: googleLoading ? "not-allowed" : "pointer",
            fontSize: "13px",
            fontWeight: 500,
            color: "#374151",
            marginBottom: "20px",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => { if (!googleLoading) e.currentTarget.style.background = "#F9FAFB"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; }}
        >
          {googleLoading ? (
            <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite", color: "#005F4B" }} />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          )}
          Continue with Google
        </button>

        {/* OR Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <div style={{ flex: 1, height: "1px", background: "#E5E7EB" }} />
          <span style={{ fontSize: "11px", color: "#9CA3AF", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            OR
          </span>
          <div style={{ flex: 1, height: "1px", background: "#E5E7EB" }} />
        </div>

        {/* Email Magic Link Form */}
        <form onSubmit={handleMagicLink} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div suppressHydrationWarning>
            <input
              id="email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={{
                width: "100%",
                height: "40px",
                padding: "0 12px",
                border: "1px solid #D1D5DB",
                borderRadius: "8px",
                fontSize: "13px",
                color: "#111827",
                background: "#ffffff",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#005F4B";
                e.target.style.boxShadow = "0 0 0 3px rgba(0,95,75,0.08)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#D1D5DB";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Magic Link Button */}
          <button
            type="submit"
            disabled={emailLoading || !email}
            style={{
              width: "100%",
              height: "40px",
              background: emailLoading || !email ? "#9CA3AF" : "#005F4B",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: emailLoading || !email ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "7px",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!emailLoading && email) e.currentTarget.style.background = "#004A3A";
            }}
            onMouseLeave={(e) => {
              if (!emailLoading && email) e.currentTarget.style.background = "#005F4B";
            }}
          >
            {emailLoading
              ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
              : <ArrowRight size={15} />
            }
            Email Magic Link
          </button>
        </form>

        {/* Terms */}
        <p style={{ fontSize: "11.5px", color: "#9CA3AF", textAlign: "center", marginTop: "16px", lineHeight: 1.5, margin: "16px 0 0" }}>
          By signing in, you agree to our{" "}
          <a href="#" style={{ color: "#6B7280", textDecoration: "underline" }}>terms of service</a>
          {" "}and{" "}
          <a href="#" style={{ color: "#6B7280", textDecoration: "underline" }}>privacy policy</a>.
        </p>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
