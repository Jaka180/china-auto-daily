import type { EventType } from "./types";

function normalizePart(value: string | null | undefined) {
  const normalized = String(value || "global")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || "global";
}

export function datePart(date: string | Date | null | undefined) {
  if (!date) return "unknown-date";
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "unknown-date";
  return d.toISOString().slice(0, 10);
}

export function generateEventSlug(input: {
  company: string | null;
  event_type: EventType;
  market?: string | null;
  event_date: string | Date | null;
}) {
  return [
    normalizePart(input.company),
    normalizePart(input.event_type),
    normalizePart(input.market),
    datePart(input.event_date)
  ].join("-");
}
