import { clsx, type ClassValue } from "clsx";
import { differenceInDays, format, formatDistanceToNow } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  return format(new Date(date), "MMM d, yyyy");
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "-";
  return format(new Date(date), "MMM d, yyyy h:mm a");
}

export function formatRelative(date: Date | string | null | undefined): string {
  if (!date) return "-";
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function daysSince(date: Date | string | null | undefined): number {
  if (!date) return 0;
  return differenceInDays(new Date(), new Date(date));
}

export function getDaysLabel(days: number): string {
  if (days === 0) return "Today";
  if (days === 1) return "1d ago";
  return `${days}d ago`;
}

export function getDaysColor(days: number): string {
  if (days > 30) return "text-red-500";
  if (days > 14) return "text-amber-500";
  return "text-gray-500";
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getCompanyDomain(company: string): string {
  return company.toLowerCase().replace(/[^a-z0-9]/g, "") + ".com";
}

export function formatSalary(
  min: number | null,
  max: number | null,
  currency: string = "INR"
): string {
  if (!min && !max) return "-";
  const fmt = (n: number) =>
    currency === "INR" ? `Rs ${(n / 100000).toFixed(1)}L` : `$${n.toLocaleString()}`;
  if (min && max) return `${fmt(min)} - ${fmt(max)}`;
  if (min) return `${fmt(min)}+`;
  return `Up to ${fmt(max!)}`;
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export function generateColor(str: string): string {
  const colors = [
    "#166B5B",
    "#3B82F6",
    "#8B5CF6",
    "#F59E0B",
    "#EF4444",
    "#10B981",
    "#0EA5E9",
    "#F43F5E",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
