import { fetchRssItems } from "../lib/rss";
import { ensureAdminSchema, getActiveSourceConfigs, hasDatabaseConfig, insertSignal, logExtraction } from "../lib/db";
import { normalizeSignal } from "../lib/signals/normalizer";
import { synthesizeEventsFromSignals, type SignalSynthesisSummary } from "../lib/signals/synthesis";
import { shouldKeepForExtraction } from "./filterRules";
import { loadSourcesConfig, rssSourcesOnly, shouldRunImmediately, type SourceConfig } from "./sourceConfig";

export type IngestResult = {
  stored: number;
  duplicate: number;
  rejected: number;
  failed: number;
  signals_stored: number;
  signals_duplicate: number;
};

export type IngestOptions = {
  feed?: string;
  priority?: number;
  sourcesPath?: string;
  minPriority?: number;
  immediateOnly?: boolean;
  deferredOnly?: boolean;
  limit?: number;
};

export type IngestSummary = IngestResult & {
  sources: number;
  limit: number;
  synthesis: SignalSynthesisSummary;
  source_results: Array<IngestResult & { name: string; priority: number; category: string }>;
};

function emptyResult(): IngestResult {
  return { stored: 0, duplicate: 0, rejected: 0, failed: 0, signals_stored: 0, signals_duplicate: 0 };
}

async function sourcesFromOptions(options: IngestOptions) {
  if (options.feed) {
    return [{
      name: new URL(options.feed).hostname,
      type: "rss" as const,
      url: options.feed,
      priority: options.priority || 8,
      category: "manual"
    }];
  }

  const envFeeds = (process.env.RSS_FEEDS || process.env.RSS_FEED_URLS || "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean)
    .map((url) => ({
      name: new URL(url).hostname,
      type: "rss" as const,
      url,
      priority: options.priority || 8,
      category: "env"
    }));

  const sources = envFeeds.length ? envFeeds : await getActiveSourceConfigs(rssSourcesOnly(loadSourcesConfig(options.sourcesPath)));

  return sources
    .filter((source) => !options.minPriority || source.priority >= options.minPriority)
    .filter((source) => !options.immediateOnly || shouldRunImmediately(source))
    .filter((source) => !options.deferredOnly || !shouldRunImmediately(source))
    .sort((a, b) => b.priority - a.priority || a.name.localeCompare(b.name));
}

async function ingestFeed(source: SourceConfig, limit: number): Promise<IngestResult> {
  const result = emptyResult();
  if (!source.url) return result;

  const items = await fetchRssItems(source.url, limit, source);

  for (const item of items) {
    try {
      const signal = normalizeSignal(item, source);
      const filter = shouldKeepForExtraction(item, source);
      const policyOrMacroSignal =
        signal.source_type === "POLICY" ||
        signal.source_type === "MACRO" ||
        signal.signal_type === "POLICY_SIGNAL" ||
        signal.signal_type === "REGULATORY_SIGNAL";

      if (!filter.keep && !policyOrMacroSignal) {
        result.rejected += 1;
        await logExtraction({
          source_url: item.source_url,
          source_name: item.source_name,
          raw_title: item.title,
          raw_content: item.content,
          source_priority: source.priority,
          source_category: source.category,
          status: "rejected",
          error: `filter:${filter.reason}`
        });
        continue;
      }

      const stored = await insertSignal(signal);

      if (stored.status === "stored") result.signals_stored += 1;
      else result.signals_duplicate += 1;
      await logExtraction({
        source_url: item.source_url,
        source_name: item.source_name,
        raw_title: item.title,
        raw_content: item.content,
        source_priority: source.priority,
        source_category: source.category,
        article_hash: stored.signal.signal_hash,
        extracted_output: signal,
        status: stored.status
      });
    } catch (error) {
      result.failed += 1;
      await logExtraction({
        source_url: item.source_url,
        source_name: item.source_name,
        raw_title: item.title,
        raw_content: item.content,
        source_priority: source.priority,
        source_category: source.category,
        status: "failed",
        error: error instanceof Error ? error.message : String(error)
      }).catch(() => undefined);
    }
  }

  return result;
}

export async function runRssIngestion(options: IngestOptions = {}): Promise<IngestSummary> {
  if (!hasDatabaseConfig()) {
    throw new Error("DATABASE_URL or SUPABASE_DATABASE_URL is required");
  }
  await ensureAdminSchema();

  const limit = options.limit || 20;
  const sources = await sourcesFromOptions(options);
  if (!sources.length) {
    throw new Error("No RSS sources available");
  }

  const totals: IngestSummary = {
    ...emptyResult(),
    sources: sources.length,
    limit,
    synthesis: { clusters: 0, synthesized: 0, duplicate: 0, skipped: 0 },
    source_results: []
  };

  for (const source of sources) {
    let result: IngestResult;
    try {
      result = await ingestFeed(source, limit);
    } catch (error) {
      result = { ...emptyResult(), failed: 1 };
      await logExtraction({
        source_url: source.url || ("endpoint" in source ? source.endpoint : undefined) || source.name,
        source_name: source.name,
        raw_title: source.name,
        raw_content: "",
        source_priority: source.priority,
        source_category: source.category,
        status: "failed",
        error: error instanceof Error ? error.message : String(error)
      }).catch(() => undefined);
    }
    totals.stored += result.stored;
    totals.duplicate += result.duplicate;
    totals.rejected += result.rejected;
    totals.failed += result.failed;
    totals.signals_stored += result.signals_stored;
    totals.signals_duplicate += result.signals_duplicate;
    totals.source_results.push({
      ...result,
      name: source.name,
      priority: source.priority,
      category: source.category
    });
  }

  const synthesis = await synthesizeEventsFromSignals(500);
  totals.synthesis = synthesis;
  totals.stored += synthesis.synthesized;
  totals.duplicate += synthesis.duplicate;

  return totals;
}
