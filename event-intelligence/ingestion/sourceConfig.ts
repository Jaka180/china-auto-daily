import { z } from "zod";
import defaultSourcesConfig from "./sources.json";

export const sourceTypeSchema = z.enum(["rss", "api", "scraper"]);

export const sourceSchema = z.object({
  name: z.string().min(1),
  type: sourceTypeSchema,
  url: z.string().url().optional(),
  endpoint: z.string().url().optional(),
  query: z.string().optional(),
  region: z.string().optional(),
  priority: z.number().int().min(1).max(10)
}).refine((source) => Boolean(source.url || source.endpoint), {
  message: "source requires url or endpoint"
});

export const sourcesConfigSchema = z.record(z.string(), z.array(sourceSchema));

export type SourceConfig = z.infer<typeof sourceSchema> & {
  category: string;
};

export function sourceCadenceMinutes(source: Pick<SourceConfig, "type" | "priority">) {
  if (source.priority >= 10) return 10;
  if (source.type === "api") return 60;
  if (source.priority >= 8) return 30;
  return 60;
}

export function shouldRunImmediately(source: Pick<SourceConfig, "priority">) {
  return source.priority >= 8;
}

export function sourceTrustLabel(priority: number) {
  if (priority >= 10) return "official_oem";
  if (priority >= 9) return "top_tier_media";
  if (priority >= 8) return "vertical_media";
  if (priority >= 7) return "china_media";
  return "api_aggregator";
}

export function loadSourcesConfig(filePath?: string) {
  const configuredPath = filePath || process.env.RSS_CONFIG_PATH;
  if (configuredPath && !configuredPath.endsWith("ingestion/sources.json")) {
    throw new Error("Only the bundled ingestion/sources.json config is supported in production");
  }
  const raw = defaultSourcesConfig;
  const parsed = sourcesConfigSchema.parse(raw);
  return Object.entries(parsed).flatMap(([category, sources]) =>
    sources.map((source) => ({ ...source, category }))
  ).sort((a, b) => b.priority - a.priority || a.name.localeCompare(b.name));
}

export function rssSourcesOnly(sources: SourceConfig[]) {
  return sources.filter((source) => source.type === "rss" && source.url);
}
