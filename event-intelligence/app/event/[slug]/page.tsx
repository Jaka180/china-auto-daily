import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventCard } from "@/components/EventCard";
import { EventFacts } from "@/components/EventFacts";
import { SetupNotice } from "@/components/SetupNotice";
import { getEventBySlug, getRelatedEvents, hasDatabaseConfig } from "@/lib/db";
import { eventTypeLabel, resolveLocale, t, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ lang?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!hasDatabaseConfig()) return { title: "Database Setup Required" };
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Event Not Found" };

  return {
    title: event.title,
    description: event.summary,
    keywords: [event.company, event.market, event.model, event.event_type, "China auto event intelligence"].filter(Boolean) as string[],
    alternates: {
      canonical: `/event/${event.slug}`,
      languages: {
        en: `/event/${event.slug}`,
        "zh-CN": `/event/${event.slug}?lang=zh`
      }
    },
    openGraph: {
      type: "article",
      title: event.title,
      description: event.summary,
      url: `/event/${event.slug}`,
      publishedTime: event.event_date || undefined
    }
  };
}

export default async function EventPage({ params, searchParams }: Props) {
  const locale = resolveLocale((await searchParams)?.lang);
  const copy = t(locale);

  if (!hasDatabaseConfig()) {
    return (
      <main className="mx-auto max-w-5xl px-5 py-10">
        <SetupNotice locale={locale} />
      </main>
    );
  }

  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();
  const relatedEvents = await getRelatedEvents(event, 6);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: event.title,
    description: event.summary,
    ...(event.event_date ? { datePublished: event.event_date } : {}),
    dateModified: event.created_at,
    mainEntityOfPage: `/event/${event.slug}`,
    author: { "@type": "Organization", name: "TopChinaCar" },
    publisher: { "@type": "Organization", name: "TopChinaCar" },
    isBasedOn: event.source_url,
    about: [event.company, event.market, event.model].filter(Boolean),
    citation: event.raw_evidence
  };

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <article>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          {eventTypeLabel(event.event_type, locale)}
        </p>
        <h1 className="max-w-4xl text-4xl font-bold leading-tight tracking-tight text-ink">{event.title}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-muted">{event.summary}</p>

        {event.low_confidence ? (
          <div className="mt-5 rounded border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-900">
            {copy.lowConfidenceNotice}
          </div>
        ) : null}

        <div className="mt-8">
          <EventFacts event={event} locale={locale} />
        </div>

        <section className="mt-8 rounded border border-line bg-white p-5">
          <h2 className="text-lg font-semibold text-ink">{copy.sourceSection}</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            {copy.sourceTrace}{" "}
            <a className="text-accent hover:underline" href={event.source_url} rel="noopener noreferrer" target="_blank">
              {event.source_name || event.source_url}
            </a>.
          </p>
        </section>

        <section className="mt-5 rounded border border-line bg-white p-5">
          <h2 className="text-lg font-semibold text-ink">{copy.rawEvidence}</h2>
          <blockquote className="mt-2 border-l-2 border-accent pl-4 text-sm leading-6 text-muted">
            {event.raw_evidence}
          </blockquote>
        </section>

        <section className="mt-10">
          <div className="border-l-4 border-accent pl-4">
            <h2 className="text-xl font-semibold text-ink">{copy.relatedEvents}</h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              {copy.relatedDescription}
            </p>
          </div>
          <div className="mt-4 border-y border-line bg-white px-5">
            {relatedEvents.length ? relatedEvents.map((related) => (
              <EventCard event={related} key={related.id} locale={locale} />
            )) : (
              <p className="py-8 text-sm text-muted">{copy.noRelated}</p>
            )}
          </div>
        </section>
      </article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </main>
  );
}
