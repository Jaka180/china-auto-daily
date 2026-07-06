import type { StoredEvent } from "@/lib/events/types";
import type { Locale } from "@/lib/i18n";
import { readerScoreDetails, readerScorePillars, readerSignal, scoreDetailsLabel, systemReadingLabel } from "@/lib/readerScores";

export function EventReaderScore({ event, locale = "en" }: { event: StoredEvent; locale?: Locale }) {
  const signal = readerSignal(event, locale);
  const pillars = readerScorePillars(event, locale);
  const details = readerScoreDetails(event, locale);

  return (
    <section className="rounded border border-line bg-gradient-to-b from-white to-zinc-50 p-4">
      <div className="border-b border-line pb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{systemReadingLabel(locale)}</p>
        <h3 className="mt-1 text-lg font-semibold leading-snug text-ink">{signal.label}</h3>
        <p className="mt-1 text-sm leading-6 text-muted">{signal.detail}</p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {pillars.map((pillar) => (
          <div className="border-l-2 border-line pl-3" key={pillar.label}>
            <p className="text-sm font-semibold leading-snug text-ink">{pillar.label}</p>
            <p className="mt-1 text-xs leading-5 text-muted">{pillar.detail}</p>
          </div>
        ))}
      </div>

      <details className="mt-4 border-t border-line pt-3">
        <summary className="w-fit cursor-pointer text-xs font-semibold uppercase tracking-wide text-muted hover:text-accent">
          {scoreDetailsLabel(locale)}
        </summary>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          {details.map(([label, value]) => (
            <div className="rounded border border-line bg-white p-3" key={label}>
              <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
              <dd className="mt-1 font-semibold text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </details>
    </section>
  );
}
