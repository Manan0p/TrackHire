"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  List,
  Calendar,
  BarChart3,
  Settings,
  Plus,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/board", label: "Board", icon: LayoutGrid },
  { href: "/list", label: "List", icon: List },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  const handleAddClick = () => {
    window.dispatchEvent(new CustomEvent("open-add-application"));
  };

  return (
    <aside className="h-screen w-[180px] bg-[var(--inverse-surface)] border-r border-black/20 flex flex-col py-6 px-4 z-20 shrink-0">
      {/* Brand */}
      <div className="mb-8 px-1">
        <span className="block whitespace-nowrap font-bold text-[36px] tracking-[-0.02em] text-white leading-[0.95]">TrackHire</span>
        <span className="block text-[11px] font-medium text-[var(--sidebar-foreground)] opacity-75 mt-1">
          Career Manager
        </span>
      </div>

      {/* CTA Button */}
      <div className="mb-6">
        <button
          onClick={handleAddClick}
          className="w-full bg-[var(--primary-container)] text-[var(--on-primary-container)] font-semibold text-[12px] py-2 px-3 rounded-lg flex items-center justify-center gap-1 hover:bg-[var(--primary)] transition-colors duration-200"
        >
          <Plus className="w-[18px] h-[18px] text-white" strokeWidth={2.4} />
          <span>Add Application</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <nav className="flex-1 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 text-[12px] font-medium",
                active
                  ? "bg-[var(--primary-container)] text-white font-semibold shadow-sm"
                  : "text-[var(--sidebar-foreground)] hover:text-white hover:bg-[var(--primary-container)]/20"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={active ? 2.1 : 1.8} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom account strip */}
      <div className="mt-auto border-t border-white/10 pt-4">
        <button className="flex w-full items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-medium text-[var(--sidebar-foreground)] hover:text-white hover:bg-[var(--primary-container)]/20 transition-colors duration-200">
          <User className="w-4 h-4 flex-shrink-0" strokeWidth={1.8} />
          <span>Account</span>
        </button>
      </div>
    </aside>
  );
}
