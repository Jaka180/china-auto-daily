import type { StoredEvent } from "@/lib/events/types";
import { formatScore } from "@/lib/events/scoring";
import { eventTypeLabel, localeDate, t, type Locale } from "@/lib/i18n";

const factClass = "rounded border border-line bg-white p-4";

export function EventFacts({ event, locale = "en" }: { event: StoredEvent; locale?: Locale }) {
  const copy = t(locale);
  const facts = [
    [copy.type, eventTypeLabel(event.event_type, locale)],
    [copy.company, event.company || copy.companyUnknown],
    [copy.market, event.market || copy.companyUnknown],
    [copy.model, event.model || copy.notSpecified],
    [copy.eventDate, event.event_date ? new Intl.DateTimeFormat(localeDate(locale), { dateStyle: "medium" }).format(new Date(event.event_date)) : copy.dateUnknown],
    [copy.impact, `${formatScore(event.impact_score)} / 10`],
    [copy.confidence, `${Math.round(event.confidence_score * 100)}%`],
    [copy.finalScore, formatScore(event.final_score)],
    [copy.sourcePriority, formatScore(event.source_priority)]
  ];

  return (
    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {facts.map(([label, value]) => (
        <div className={factClass} key={label}>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">{label}</dt>
          <dd className="mt-1 text-base font-semibold text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
