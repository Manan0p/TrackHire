"use client";

import { AppStatus } from "@prisma/client";
import { STATUS_LABELS, STATUS_BG } from "@/types";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: AppStatus;
  className?: string;
  size?: "sm" | "md";
}

export function StatusBadge({ status, className, size = "md" }: StatusBadgeProps) {
  const badgeClass = `badge-${status.toLowerCase()}`;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium leading-none",
        size === "sm" ? "text-[11px] px-2 py-0.5" : "text-xs px-2.5 py-1",
        badgeClass,
        className
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
