import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncate(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max).trimEnd() + '…'
}

/** Converts ISO date string (YYYY-MM-DD) to Brazilian format (DD/MM/AAAA). */
export function formatDateBR(isoDate: string): string {
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return isoDate
  return `${match[3]}/${match[2]}/${match[1]}`
}
