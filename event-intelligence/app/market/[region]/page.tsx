import type { Metadata } from "next";
import { EventCard } from "@/components/EventCard";
import { SetupNotice } from "@/components/SetupNotice";
import { getMarket, hasDatabaseConfig, listEvents } from "@/lib/db";
import { resolveLocale, t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ region: string }>;
  searchParams?: Promise<{ lang?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { region: rawRegion } = await params;
  const region = decodeURIComponent(rawRegion);
  return {
    title: `${region} China Auto Events`,
    description: `Structured event timeline for Chinese automakers in ${region}.`,
    keywords: [region, "Chinese cars", "EV market intelligence", "China auto exports"],
    alternates: {
      canonical: `/market/${encodeURIComponent(region)}`,
      languages: {
        en: `/market/${encodeURIComponent(region)}`,
        "zh-CN": `/market/${encodeURIComponent(region)}?lang=zh`
      }
    }
  };
}

export default async function MarketPage({ params, searchParams }: Props) {
  const { region: rawRegion } = await params;
  const region = decodeURIComponent(rawRegion);
  const locale = resolveLocale((await searchParams)?.lang);
  const copy = t(locale);
  const [market, events] = hasDatabaseConfig()
    ? await Promise.all([
      getMarket(region),
      listEvents({ market: region, limit: 80 })
    ])
    : [null, []];

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <section className="max-w-3xl">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">{copy.market}</p>
        <h1 className="text-4xl font-bold tracking-tight text-ink">{region}</h1>
        <p className="mt-4 text-base leading-7 text-muted">
          {market?.region ? `${market.region} ${copy.marketSummarySuffix}` : copy.marketSummaryFallback}
        </p>
      </section>

      <section className="mt-8 rounded border border-line bg-white px-5">
        <h2 className="border-b border-line py-4 text-lg font-semibold text-ink">{copy.relatedEventsHeading}</h2>
        {!hasDatabaseConfig() ? <div className="py-5"><SetupNotice locale={locale} /></div> : events.length ? events.map((event) => <EventCard event={event} key={event.id} locale={locale} />) : (
          <p className="py-10 text-sm text-muted">{copy.noMarketEvents}</p>
        )}
      </section>
    </main>
  );
}
