import type { Metadata } from "next";
import { EventCard } from "@/components/EventCard";
import { SetupNotice } from "@/components/SetupNotice";
import { getCompany, hasDatabaseConfig, listEvents } from "@/lib/db";
import { resolveLocale, t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ name: string }>;
  searchParams?: Promise<{ lang?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name: rawName } = await params;
  const name = decodeURIComponent(rawName);
  return {
    title: `${name} Events`,
    description: `Structured event timeline for ${name} in China automotive global expansion.`,
    keywords: [name, "Chinese automaker events", "China auto global expansion"],
    alternates: {
      canonical: `/company/${encodeURIComponent(name)}`,
      languages: {
        en: `/company/${encodeURIComponent(name)}`,
        "zh-CN": `/company/${encodeURIComponent(name)}?lang=zh`
      }
    }
  };
}

export default async function CompanyPage({ params, searchParams }: Props) {
  const { name: rawName } = await params;
  const name = decodeURIComponent(rawName);
  const locale = resolveLocale((await searchParams)?.lang);
  const copy = t(locale);
  const [company, events] = hasDatabaseConfig()
    ? await Promise.all([
      getCompany(name),
      listEvents({ company: name, limit: 80 })
    ])
    : [null, []];

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <section className="max-w-3xl">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">{copy.company}</p>
        <h1 className="text-4xl font-bold tracking-tight text-ink">{name}</h1>
        <p className="mt-4 text-base leading-7 text-muted">
          {company ? `${company.country || "Unknown country"} · ${company.type || "Unknown type"}` : copy.companyProfileFallback}
        </p>
      </section>

      <section className="mt-8 rounded border border-line bg-white px-5">
        <h2 className="border-b border-line py-4 text-lg font-semibold text-ink">{copy.relatedTimeline}</h2>
        {!hasDatabaseConfig() ? <div className="py-5"><SetupNotice locale={locale} /></div> : events.length ? events.map((event) => <EventCard event={event} key={event.id} locale={locale} />) : (
          <p className="py-10 text-sm text-muted">{copy.noCompanyEvents}</p>
        )}
      </section>
    </main>
  );
}
