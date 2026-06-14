"use client";

import { Source } from "@prisma/client";
import { SOURCE_LABELS, SOURCE_COLORS } from "@/types";
import { cn } from "@/lib/utils";

interface SourceBadgeProps {
  source: Source;
  className?: string;
  size?: "sm" | "md";
}

export function SourceBadge({ source, className, size = "md" }: SourceBadgeProps) {
  const color = SOURCE_COLORS[source];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium leading-none border",
        size === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-0.5",
        className
      )}
      style={{
        backgroundColor: `${color}18`,
        color,
        borderColor: `${color}30`,
      }}
    >
      {SOURCE_LABELS[source]}
    </span>
  );
}
