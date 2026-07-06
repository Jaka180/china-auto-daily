import type { MetadataRoute } from "next";
import { hasDatabaseConfig, listSitemapEntities } from "@/lib/db";
import { EVENT_APP_URL } from "@/lib/site";

function absolute(path: string) {
  return `${EVENT_APP_URL}${path}`;
}

function entry(path: string, lastModified?: string | null): MetadataRoute.Sitemap[number] {
  return {
    url: absolute(path),
    lastModified: lastModified ? new Date(lastModified) : new Date()
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseEntries: MetadataRoute.Sitemap = [
    entry("/"),
    entry("/news"),
    entry("/news?lang=zh")
  ];

  if (!hasDatabaseConfig()) return baseEntries;

  const entities = await listSitemapEntities();
  return [
    ...baseEntries,
    ...entities.events.flatMap((event) => [
      entry(`/event/${event.slug}`, event.updated_at),
      entry(`/event/${event.slug}?lang=zh`, event.updated_at)
    ]),
    ...entities.companies.flatMap((company) => [
      entry(`/company/${encodeURIComponent(company.name)}`, company.updated_at),
      entry(`/company/${encodeURIComponent(company.name)}?lang=zh`, company.updated_at)
    ]),
    ...entities.markets.flatMap((market) => [
      entry(`/market/${encodeURIComponent(market.name)}`, market.updated_at),
      entry(`/market/${encodeURIComponent(market.name)}?lang=zh`, market.updated_at)
    ])
  ];
}
