"use client";

import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

interface TopBarProps {
  user?: { name?: string | null; email?: string | null; image?: string | null };
}

export function TopBar({ user }: TopBarProps) {
  const pathname = usePathname();

  return (
    <div className="h-12 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between px-4 flex-shrink-0">
      <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 border border-[var(--border)] rounded text-[11px] text-[var(--text-subtle)] bg-[var(--background)]">
        <span>⌘</span>K
      </kbd>

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 hover:opacity-80 transition-opacity outline-none">
          <Avatar className="w-7 h-7">
            <AvatarImage src={user?.image || undefined} />
            <AvatarFallback className="bg-[var(--primary-light)] text-[var(--primary)] text-[11px] font-semibold">
              {getInitials(user?.name || user?.email || "U")}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <div className="px-2 py-1.5">
            <p className="text-[13px] font-medium truncate">{user?.name || "User"}</p>
            <p className="text-[11px] text-[var(--text-muted)] truncate">{user?.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-red-600 text-[13px] gap-2 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
