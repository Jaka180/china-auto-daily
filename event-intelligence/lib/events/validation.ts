import { extractedEventSchema, type ExtractedEvent } from "./types";

export function validateExtractedEvent(value: unknown) {
  const parsed = extractedEventSchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")
    };
  }

  const event = parsed.data;
  const eventDate = event.event_date ? new Date(event.event_date) : null;
  if (eventDate && Number.isNaN(eventDate.getTime())) {
    return { ok: false as const, error: "event_date is not a valid date" };
  }

  if (!event.source_url) {
    return { ok: false as const, error: "source_url is required" };
  }

  if (event.confidence_score < 0.5) {
    return { ok: false as const, error: "confidence_score below storage threshold" };
  }

  return { ok: true as const, event: event as ExtractedEvent };
}
