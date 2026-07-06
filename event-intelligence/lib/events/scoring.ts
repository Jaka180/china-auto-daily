import type { EventType, StoredEvent } from "./types";

export const MARKET_MOVEMENT_TYPES: EventType[] = [
  "sales_update",
  "partnership",
  "dealer_expansion",
  "export",
  "investment",
  "localization"
];

export function normalizeSourcePriority(priority: number | null | undefined) {
  if (!Number.isFinite(priority || 0)) return 6;
  return Math.max(1, Math.min(10, Number(priority)));
}

export function computeFinalScore(input: {
  impact_score: number;
  confidence_score: number;
  source_priority?: number | null;
}) {
  const finalScore =
    Number(input.impact_score || 0) * 0.5 +
    Number(input.confidence_score || 0) * 10 * 0.3 +
    normalizeSourcePriority(input.source_priority) * 0.2;

  return Number(finalScore.toFixed(2));
}

export function getEventTier(event: Pick<StoredEvent, "impact_score" | "confidence_score" | "event_type">) {
  if (event.impact_score >= 7 && event.confidence_score >= 0.7) return "high-impact";
  if (MARKET_MOVEMENT_TYPES.includes(event.event_type)) return "market-movement";
  return "all-events";
}

export function formatScore(score: number | null | undefined) {
  return Number(score || 0).toFixed(1);
}
