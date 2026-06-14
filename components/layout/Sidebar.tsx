"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  List,
  Calendar,
  BarChart3,
  Plus,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/board", label: "Board", icon: LayoutGrid },
  { href: "/list", label: "List", icon: List },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  const handleAddClick = () => {
    window.dispatchEvent(new CustomEvent("open-add-application"));
  };

  return (
    <aside
      style={{
        width: "215px",
        height: "100vh",
        background: "#1C2333",
        borderRight: "1px solid rgba(255,255,255,0.07)",
        display: "flex",
        flexDirection: "column",
        padding: "24px 12px",
        flexShrink: 0,
        zIndex: 20,
      }}
    >
      {/* Brand */}
      <div style={{ marginBottom: "24px", padding: "0 8px" }}>
        <span
          style={{
            display: "block",
            fontSize: "20px",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "#ffffff",
            lineHeight: 1.1,
          }}
        >
          TrackHire
        </span>
        <span
          style={{
            display: "block",
            fontSize: "11px",
            color: "rgba(255,255,255,0.45)",
            marginTop: "3px",
            fontWeight: 400,
          }}
        >
          Career Manager
        </span>
      </div>

      {/* CTA Button */}
      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={handleAddClick}
          style={{
            width: "100%",
            height: "36px",
            background: "#005F4B",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#00503F")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#005F4B")}
        >
          <Plus size={15} strokeWidth={2.5} />
          Add Application
        </button>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "9px",
                padding: "9px 10px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: active ? 600 : 500,
                textDecoration: "none",
                color: active ? "#ffffff" : "rgba(255,255,255,0.6)",
                background: active ? "#005F4B" : "transparent",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.07)";
                  (e.currentTarget as HTMLAnchorElement).style.color = "#ffffff";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                  (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.6)";
                }
              }}
            >
              <Icon size={16} strokeWidth={active ? 2.2 : 1.8} style={{ flexShrink: 0 }} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Account → /settings */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.08)",
          paddingTop: "12px",
          marginTop: "12px",
        }}
      >
        {(() => {
          const active = pathname === "/settings";
          return (
            <Link
              href="/settings"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "9px",
                padding: "9px 10px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: active ? 600 : 500,
                textDecoration: "none",
                color: active ? "#ffffff" : "rgba(255,255,255,0.6)",
                background: active ? "#005F4B" : "transparent",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.07)";
                  (e.currentTarget as HTMLAnchorElement).style.color = "#ffffff";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                  (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.6)";
                }
              }}
            >
              <User size={16} strokeWidth={active ? 2.2 : 1.8} style={{ flexShrink: 0 }} />
              <span>Account</span>
            </Link>
          );
        })()}
      </div>
    </aside>
  );
}
