"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { LogOut, User } from "lucide-react";
import { getInitials } from "@/lib/utils";

/**
 * Drop-in avatar button that shows a popover with name, email, and Sign Out.
 * Uses the user's Google profile picture automatically via next-auth session.
 *
 * Usage: <UserAvatar />
 */
export function UserAvatar({ size = 32 }: { size?: number }) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const user = session?.user;
  const initials = getInitials(user?.name || user?.email || "U");

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: size, height: size, borderRadius: "50%",
          overflow: "hidden", padding: 0, border: "2px solid #E5E7EB",
          cursor: "pointer", background: "#005F4B",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "border-color 0.15s, box-shadow 0.15s",
          boxShadow: open ? "0 0 0 3px rgba(0,95,75,0.2)" : "none",
        }}
        title={user?.name || "Account"}
      >
        {user?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt={user.name || "avatar"}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span style={{ fontSize: size * 0.38, fontWeight: 700, color: "#fff", lineHeight: 1 }}>
            {initials}
          </span>
        )}
      </button>

      {/* Popover */}
      {open && (
        <div
          style={{
            position: "absolute", right: 0, top: size + 6, zIndex: 100,
            background: "#fff", border: "1px solid #E5E7EB",
            borderRadius: 10, padding: "4px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)",
            minWidth: 200,
            animation: "fadeIn 0.1s ease-out",
          }}
        >
          {/* User info block */}
          <div style={{ padding: "10px 12px 10px", borderBottom: "1px solid #F3F4F6" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Mini avatar */}
              <div style={{
                width: 36, height: 36, borderRadius: "50%", overflow: "hidden",
                background: "#005F4B", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {user?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{initials}</span>
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user?.name || "User"}
                </p>
                <p style={{ fontSize: 11.5, color: "#6B7280", margin: "1px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Sign out */}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 8,
              padding: "9px 12px", borderRadius: 7, border: "none",
              background: "transparent", color: "#DC2626",
              fontSize: 13, fontWeight: 500, cursor: "pointer",
              transition: "background 0.12s",
              marginTop: 2,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#FEF2F2")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      )}

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
