import { XMLParser } from "fast-xml-parser";
import { rawNewsSchema, type RawNews } from "./events/types";
import type { SourceConfig } from "../ingestion/sourceConfig";

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function stripHtml(html: unknown) {
  return String(html || "")
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function pickText(value: unknown) {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (value && typeof value === "object" && "#text" in value) return String((value as { "#text": unknown })["#text"]);
  return "";
}

function pickLink(item: Record<string, unknown>) {
  const link = item.link;
  if (typeof link === "string") return link;
  if (link && typeof link === "object") {
    const record = link as Record<string, unknown>;
    if (typeof record.href === "string") return record.href;
    if (typeof record["@_href"] === "string") return record["@_href"];
  }
  if (typeof item.guid === "string" && item.guid.startsWith("http")) return item.guid;
  return "";
}

export async function fetchRssItems(feedUrl: string, limit = 20, source?: SourceConfig): Promise<RawNews[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  const response = await fetch(feedUrl, {
    headers: { "user-agent": "TopChinaCar Event Intelligence/1.0" },
    signal: controller.signal
  }).finally(() => clearTimeout(timeout));
  if (!response.ok) throw new Error(`RSS fetch failed ${response.status} for ${feedUrl}`);

  const xml = await response.text();
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    textNodeName: "#text"
  });
  const parsed = parser.parse(xml);
  const channel = parsed?.rss?.channel || parsed?.feed || {};
  const sourceName = pickText(channel.title) || new URL(feedUrl).hostname;
  const items = asArray<Record<string, unknown>>(channel.item || channel.entry).slice(0, limit);

  return items.flatMap((item) => {
    const title = stripHtml(item.title);
    const link = pickLink(item);
    const content = stripHtml(
      item["content:encoded"] ||
      item.content ||
      item.summary ||
      item.description ||
      item.title
    );
    const published = pickText(item.pubDate || item.published || item.updated || item["dc:date"]);
    const parsedRaw = rawNewsSchema.safeParse({
      title,
      content,
      source_url: link,
      source_name: source?.name || sourceName,
      published_at: published || null,
      source_priority: source?.priority || null,
      source_category: source?.category || null,
      source_region: source?.region || null
    });
    return parsedRaw.success ? [parsedRaw.data] : [];
  });
}
