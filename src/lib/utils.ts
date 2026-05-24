import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function uuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function formatDate(d: Date | string | number, locale = "ko-KR") {
  const date = typeof d === "string" || typeof d === "number" ? new Date(d) : d;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatDateTime(d: Date | string | number, locale = "ko-KR") {
  const date = typeof d === "string" || typeof d === "number" ? new Date(d) : d;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function completionBucket(rate?: number | null): "low" | "mid" | "high" | "none" {
  if (rate === null || rate === undefined || Number.isNaN(rate)) return "none";
  if (rate <= 60) return "low";
  if (rate <= 80) return "mid";
  return "high";
}
