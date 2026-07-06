import crypto from "node:crypto";
import { titleSimilarity } from "../lib/events/dedupe";
import type { ExtractedEvent, StoredEvent } from "../lib/events/types";

function normalize(value: string | null | undefined) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function dateKey(value: string | null | undefined) {
  if (!value) return "unknown-date";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "unknown-date" : date.toISOString().slice(0, 10);
}

export function rssEventHash(event: Pick<ExtractedEvent, "title" | "company" | "event_date">) {
  const raw = `${normalize(event.title)}|${normalize(event.company)}|${dateKey(event.event_date)}`;
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export function isRssDuplicate(candidate: ExtractedEvent, existing: Pick<StoredEvent, "title" | "company" | "event_date">) {
  if ((candidate.company || "").toLowerCase() !== (existing.company || "").toLowerCase()) return false;
  return titleSimilarity(candidate.title, existing.title) > 0.85;
}
