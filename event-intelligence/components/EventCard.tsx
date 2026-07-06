import type { StoredEvent } from "@/lib/events/types";
import { formatScore } from "@/lib/events/scoring";
import { eventTypeLabel, localeDate, t, withLocale, type Locale } from "@/lib/i18n";

function formatDate(date: string | null, locale: Locale) {
  if (!date) return t(locale).dateUnknown;
  return new Intl.DateTimeFormat(localeDate(locale), { dateStyle: "medium" }).format(new Date(date));
}

function priorityLabel(rank: number | undefined, finalScore: number, locale: Locale) {
  const copy = t(locale);
  if (rank && rank <= 5) return copy.highPriority;
  if (finalScore >= 6) return copy.medium;
  return copy.lowImpact;
}

export function EventCard({ event, rank, locale = "en" }: { event: StoredEvent; rank?: number; locale?: Locale }) {
  const copy = t(locale);
  const dataLabel = event.is_seed ? copy.systemData : copy.liveData;
  const priority = priorityLabel(rank, event.final_score, locale);

  return (
    <article className="border-b border-line py-5">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted">
        {rank ? <span className="rounded bg-ink px-2 py-0.5 text-white">{copy.rank} #{rank}</span> : null}
        <span className={event.is_seed ? "rounded bg-line px-2 py-0.5 text-ink" : "rounded bg-green-50 px-2 py-0.5 text-green-800"}>{dataLabel}</span>
        <span className={priority === copy.highPriority ? "rounded bg-red-50 px-2 py-0.5 text-red-700" : priority === copy.medium ? "rounded bg-yellow-50 px-2 py-0.5 text-yellow-800" : "rounded bg-blue-50 px-2 py-0.5 text-blue-800"}>{priority}</span>
        <span>{formatDate(event.event_date, locale)}</span>
        <span>{eventTypeLabel(event.event_type, locale)}</span>
        {event.low_confidence ? <span className="rounded bg-yellow-100 px-2 py-0.5 text-yellow-800">{copy.lowConfidence}</span> : null}
      </div>
      <h2 className="text-xl font-semibold leading-snug text-ink">
        <a className="hover:text-accent" href={withLocale(`/event/${event.slug}`, locale)}>{event.title}</a>
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted">{event.summary}</p>
      <div className="mt-3 flex flex-wrap gap-3 text-sm">
        {event.company ? (
          <a className="text-accent hover:underline" href={withLocale(`/company/${encodeURIComponent(event.company)}`, locale)}>{event.company}</a>
        ) : (
          <span className="text-muted">{copy.companyUnknown}</span>
        )}
        {event.market ? <a className="text-accent hover:underline" href={withLocale(`/market/${encodeURIComponent(event.market)}`, locale)}>{event.market}</a> : null}
        {event.model ? <span className="text-muted">{event.model}</span> : null}
      </div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-6">
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">{copy.impact}</dt>
          <dd className="font-semibold text-ink">{formatScore(event.impact_score)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">{copy.confidence}</dt>
          <dd className="font-semibold text-ink">{event.confidence_score.toFixed(2)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">{copy.finalScore}</dt>
          <dd className="font-semibold text-ink">{formatScore(event.final_score)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">{copy.source}</dt>
          <dd className="truncate font-semibold text-ink">{event.source_name || new URL(event.source_url).hostname}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">{copy.priority}</dt>
          <dd className="font-semibold text-ink">{formatScore(event.source_priority)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">{copy.date}</dt>
          <dd className="font-semibold text-ink">{formatDate(event.event_date, locale)}</dd>
        </div>
      </dl>
    </article>
  );
}
