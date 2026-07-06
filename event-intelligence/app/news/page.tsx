import type { Metadata } from "next";
import { EventCard } from "@/components/EventCard";
import { InsightHeader } from "@/components/InsightHeader";
import { SetupNotice } from "@/components/SetupNotice";
import { SystemStatus } from "@/components/SystemStatus";
import { getEventTier } from "@/lib/events/scoring";
import { EVENT_TYPES, eventTypeSchema } from "@/lib/events/types";
import { generateSystemInsight, selectInsightEvents } from "@/lib/insightGenerator";
import { eventTypeLabel, resolveLocale, t, type Locale } from "@/lib/i18n";
import { ensureSeedEvents, getSystemStatus, hasDatabaseConfig, listEvents } from "@/lib/db";
import { mainSitePath } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "TopChinaCar Intelligence Feed",
  description: "Ranked automotive intelligence feed for Chinese automakers, overseas markets, policy, factories, launches and investments.",
  keywords: ["China auto events", "Chinese automakers", "EV exports", "auto market intelligence"],
  alternates: {
    canonical: "/news",
    languages: {
      en: "/news",
      "zh-CN": "/news?lang=zh"
    }
  }
};

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function IntelligenceSection({
  title,
  tone,
  description,
  events,
  rankById,
  locale,
  empty
}: {
  title: string;
  tone: "red" | "yellow" | "blue";
  description: string;
  events: Awaited<ReturnType<typeof listEvents>>;
  rankById: Map<string, number>;
  locale: Locale;
  empty: string;
}) {
  const toneClass = {
    red: "border-red-300 text-red-700",
    yellow: "border-yellow-300 text-yellow-700",
    blue: "border-blue-300 text-blue-700"
  }[tone];

  return (
    <section className="mt-10">
      <div className={`border-l-4 pl-4 ${toneClass}`}>
        <h2 className="text-xl font-semibold text-ink">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
      </div>
      <div className="mt-4 border-y border-line bg-white px-5">
        {events.length ? events.map((event) => <EventCard event={event} key={`${title}-${event.id}`} rank={rankById.get(event.id)} locale={locale} />) : (
          <p className="py-8 text-sm text-muted">{empty}</p>
        )}
      </div>
    </section>
  );
}

export default async function NewsPage({
  searchParams
}: {
  searchParams: Promise<{ company?: string; market?: string; type?: string; lang?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const locale = resolveLocale(resolvedSearchParams.lang);
  const copy = t(locale);
  const type = eventTypeSchema.safeParse(readParam(resolvedSearchParams.type));
  const dbConfigured = hasDatabaseConfig();
  if (dbConfigured) await ensureSeedEvents();
  const [displayEvents, allEvents, systemStatus] = dbConfigured
    ? await Promise.all([listEvents({
      company: readParam(resolvedSearchParams.company),
      market: readParam(resolvedSearchParams.market),
      type: type.success ? type.data : undefined,
      limit: 80
    }), listEvents({ limit: 80 }), getSystemStatus()])
    : [[], [], null];
  const insight = dbConfigured ? generateSystemInsight(selectInsightEvents(allEvents), locale) : null;
  const rankById = new Map(allEvents.map((event, index) => [event.id, index + 1]));
  const highImpactEvents = displayEvents.filter((event) => getEventTier(event) === "high-impact");
  const marketMovements = displayEvents.filter((event) => getEventTier(event) === "market-movement");
  const integrationLinks = [
    {
      href: mainSitePath("/intelligence", locale),
      title: locale === "zh" ? "主站情报入口" : "Main Intelligence Entry",
      description: locale === "zh" ? "系统入口、数据层和实时事件流的统一入口。" : "Unified entry for the system gateway, data layer and live event stream."
    },
    {
      href: mainSitePath("/data", locale),
      title: locale === "zh" ? "数据情报层" : "Data Intelligence Layer",
      description: locale === "zh" ? "宏观、企业、市场与车型实体结构。" : "Macro, company, market and model entity structure."
    },
    {
      href: mainSitePath("/news", locale),
      title: locale === "zh" ? "编辑新闻层" : "Editorial News Layer",
      description: locale === "zh" ? "人工编辑的简报与行业背景。" : "Human-edited briefing and industry context."
    }
  ];

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <section className="max-w-3xl">
        <div className="mb-3 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          <span>{copy.eventIntelligence}</span>
          <a className={locale === "en" ? "text-ink" : "hover:text-ink"} href="/news">EN</a>
          <a className={locale === "zh" ? "text-ink" : "hover:text-ink"} href="/news?lang=zh">中文</a>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-ink">{copy.feedTitle}</h1>
        <p className="mt-4 text-base leading-7 text-muted">
          {copy.feedDescription}
        </p>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {integrationLinks.map((link) => (
            <a
              className="rounded border border-line bg-white p-4 text-sm text-muted transition hover:border-accent hover:text-ink"
              href={link.href}
              key={link.href}
            >
              <span className="block font-semibold text-ink">{link.title}</span>
              <span className="mt-2 block leading-5">{link.description}</span>
            </a>
          ))}
        </div>
      </section>

      <InsightHeader insight={insight} locale={locale} />

      {systemStatus ? <SystemStatus status={systemStatus} locale={locale} /> : null}

      <form className="mt-8 grid gap-3 rounded border border-line bg-white p-4 md:grid-cols-4" action="/news">
        {locale === "zh" ? <input type="hidden" name="lang" value="zh" /> : null}
        <input className="rounded border border-line px-3 py-2 text-sm" name="company" placeholder={copy.filterCompany} defaultValue={readParam(resolvedSearchParams.company) || ""} />
        <input className="rounded border border-line px-3 py-2 text-sm" name="market" placeholder={copy.filterMarket} defaultValue={readParam(resolvedSearchParams.market) || ""} />
        <select className="rounded border border-line px-3 py-2 text-sm" name="type" defaultValue={type.success ? type.data : ""}>
          <option value="">{copy.allEventTypes}</option>
          {EVENT_TYPES.map((eventType) => (
            <option key={eventType} value={eventType}>{eventTypeLabel(eventType, locale)}</option>
          ))}
        </select>
        <button className="rounded bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-accent" type="submit">{copy.filter}</button>
      </form>

      {!dbConfigured ? <div className="mt-6"><SetupNotice locale={locale} /></div> : (
        <>
          <IntelligenceSection
            title={copy.highImpactTitle}
            tone="red"
            description={copy.highImpactDescription}
            events={highImpactEvents}
            rankById={rankById}
            locale={locale}
            empty={copy.highImpactEmpty}
          />
          <IntelligenceSection
            title={copy.marketMovementsTitle}
            tone="yellow"
            description={copy.marketMovementsDescription}
            events={marketMovements}
            rankById={rankById}
            locale={locale}
            empty={copy.marketMovementsEmpty}
          />
          <IntelligenceSection
            title={copy.allEventsTitle}
            tone="blue"
            description={copy.allEventsDescription}
            events={displayEvents}
            rankById={rankById}
            locale={locale}
            empty={copy.allEventsEmpty}
          />
        </>
      )}
    </main>
  );
}
