import { t, type Locale } from "@/lib/i18n";

type SystemStatusProps = {
  status: {
    rss_feeds_active: number;
    ingestion_status: string;
    last_update: string | null;
    events_today: number;
    total_events: number;
    sources: string[];
  };
  locale?: Locale;
};

function relativeTime(value: string | null, locale: Locale) {
  const copy = t(locale);
  if (!value) return copy.noIngestionLog;
  const diffMs = Date.now() - new Date(value).getTime();
  if (diffMs < 0) return copy.justNow;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return copy.justNow;
  if (minutes < 60) return locale === "zh" ? `${minutes}${copy.minAgo}` : `${minutes} ${copy.minAgo}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return locale === "zh" ? `${hours}${copy.hrAgo}` : `${hours} ${copy.hrAgo}`;
  const days = Math.floor(hours / 24);
  return locale === "zh" ? `${days}${copy.day}${copy.ago}` : `${days} ${days === 1 ? copy.day : copy.days} ${copy.ago}`;
}

export function SystemStatus({ status, locale = "en" }: SystemStatusProps) {
  const copy = t(locale);
  const sourcePreview = status.sources.slice(0, 5).join(", ");
  const facts = [
    [copy.rssFeedsActive, String(status.rss_feeds_active)],
    [copy.eventIngestion, status.ingestion_status],
    [copy.lastUpdated, relativeTime(status.last_update, locale)],
    [copy.eventsToday, String(status.events_today)],
    [copy.totalEvents, String(status.total_events)]
  ];

  return (
    <section className="mt-8 border-y border-line bg-white py-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">{copy.systemStatus}</p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            {copy.systemStatusDescription}
          </p>
        </div>
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {facts.map(([label, value]) => (
            <div className="min-w-28 border-l border-line pl-3" key={label}>
              <dt className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</dt>
              <dd className="mt-1 text-sm font-semibold text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <p className="mt-4 text-xs leading-5 text-muted">{copy.sources}: {sourcePreview || copy.noSourcesConfigured}</p>
    </section>
  );
}
