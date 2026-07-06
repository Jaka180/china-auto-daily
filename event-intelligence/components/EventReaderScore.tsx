import type { StoredEvent } from "@/lib/events/types";
import type { Locale } from "@/lib/i18n";
import { readerSignal, readerTags } from "@/lib/readerScores";

export function EventReaderScore({ event, locale = "en" }: { event: StoredEvent; locale?: Locale }) {
  const signal = readerSignal(event, locale);
  const tags = readerTags(event, locale);

  return (
    <section className="rounded border border-line bg-gradient-to-b from-white to-zinc-50 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-base font-semibold leading-snug text-ink">{signal.label}</h3>
          <p className="mt-1 text-sm leading-6 text-muted">{signal.detail}</p>
        </div>
        <div className="flex flex-wrap gap-2 md:justify-end">
          {tags.map((tag) => (
            <span className="rounded border border-line bg-white px-2.5 py-1 text-xs font-medium text-muted" key={tag.label}>
              {tag.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
