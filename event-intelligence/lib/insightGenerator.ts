import { MARKET_MOVEMENT_TYPES } from "./events/scoring";
import type { EventType, StoredEvent } from "./events/types";
import { eventTypeLabel, type Locale } from "./i18n";

export type SystemInsight = {
  core_signal: string;
  market_trend: string;
  risk_signal: string;
  confidence: number;
  based_on_events: string[];
  support_count: number;
  data_scope: "live" | "mixed" | "seed";
  generated_at: string;
};

const RISK_TYPES: EventType[] = ["tariff", "policy", "regulation", "pricing", "recall"];

function countBy<T extends string>(events: StoredEvent[], pick: (event: StoredEvent) => T | null | undefined) {
  const counts = new Map<T, number>();
  for (const event of events) {
    const key = pick(event);
    if (!key) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function uniqueSorted(values: Array<string | null>) {
  return [...new Set(values.filter(Boolean) as string[])].sort();
}

function joinLabels(values: string[]) {
  if (!values.length) return "no repeated pattern";
  if (values.length === 1) return values[0];
  return `${values.slice(0, -1).join(", ")} and ${values[values.length - 1]}`;
}

function eligibleEvents(events: StoredEvent[]) {
  const now = Date.now();
  const recentCutoff = now - 72 * 60 * 60 * 1000;
  const selected = new Map<string, StoredEvent>();

  for (const event of events.slice(0, 10)) selected.set(event.id, event);
  for (const event of events) {
    if (event.impact_score >= 7) selected.set(event.id, event);
    const eventTime = new Date(event.event_date || event.created_at).getTime();
    if (!Number.isNaN(eventTime) && eventTime >= recentCutoff) selected.set(event.id, event);
  }

  return [...selected.values()].sort((a, b) => b.final_score - a.final_score);
}

function joinLocalized(values: string[], locale: Locale) {
  if (!values.length) return locale === "zh" ? "暂无重复模式" : "no repeated pattern";
  if (locale === "zh") return values.join("、");
  return joinLabels(values);
}

export function generateSystemInsight(events: StoredEvent[], locale: Locale = "en"): SystemInsight | null {
  const support = eligibleEvents(events);
  if (support.length < 3) return null;

  const marketCounts = countBy(support, (event) => event.market);
  const typeCounts = countBy(support, (event) => event.event_type);
  const companyCounts = countBy(support, (event) => event.company);
  const topMarket = marketCounts[0]?.[0] || "multiple markets";
  const topCompany = companyCounts[0]?.[0] || "multiple OEMs";
  const topTypes = typeCounts.slice(0, 3).map(([type]) => eventTypeLabel(type, locale));
  const topMarketEvents = support.filter((event) => event.market === topMarket);
  const topMarketTypes = uniqueSorted(topMarketEvents.map((event) => eventTypeLabel(event.event_type, locale))).slice(0, 3);

  const movementEvents = support.filter((event) => MARKET_MOVEMENT_TYPES.includes(event.event_type));
  const movementMarkets = uniqueSorted(movementEvents.map((event) => event.market)).slice(0, 3);
  const movementTypes = uniqueSorted(movementEvents.map((event) => eventTypeLabel(event.event_type, locale))).slice(0, 3);

  const riskEvents = support.filter((event) => RISK_TYPES.includes(event.event_type));
  const riskMarkets = uniqueSorted(riskEvents.map((event) => event.market)).slice(0, 3);
  const riskTypes = uniqueSorted(riskEvents.map((event) => eventTypeLabel(event.event_type, locale))).slice(0, 3);

  const avgConfidence = support.reduce((sum, event) => sum + event.confidence_score, 0) / support.length;
  const coverage = Math.min(1, support.length / 10);
  const strongestCluster = Math.max(marketCounts[0]?.[1] || 1, typeCounts[0]?.[1] || 1, companyCounts[0]?.[1] || 1);
  const clusterStrength = Math.min(1, strongestCluster / support.length);
  const confidence = Number((avgConfidence * 0.55 + coverage * 0.25 + clusterStrength * 0.2).toFixed(2));

  const localizedCore = locale === "zh"
    ? `排序事件流主要聚集在 ${topMarket}，最强事件中反复出现 ${joinLocalized(topMarketTypes, locale)} 模式。`
    : `The ranked event stream clusters around ${topMarket}, with ${joinLocalized(topMarketTypes, locale)} patterns among the strongest events.`;
  const localizedTrend = locale === "zh"
    ? movementEvents.length >= 2
      ? `当前市场动向集中在 ${joinLocalized(movementMarkets, locale)}，主要由 ${joinLocalized(movementTypes, locale)} 事件驱动。`
      : `当前市场动向信号有限；最强重复模式是 ${topCompany} 及相关市场中的 ${joinLocalized(topTypes, locale)}。`
    : movementEvents.length >= 2
      ? `Current market movement is concentrated in ${joinLocalized(movementMarkets, locale)}, led by ${joinLocalized(movementTypes, locale)} events.`
      : `Current movement signals are limited; the strongest repeated pattern is ${joinLocalized(topTypes, locale)} across ${topCompany} and related markets.`;
  const localizedRisk = locale === "zh"
    ? riskEvents.length
      ? `${joinLocalized(riskMarkets, locale)} 的风险相关事件由当前事件流中的 ${joinLocalized(riskTypes, locale)} 信号驱动。`
      : "当前事件流中没有足够强的重复风险模式。"
    : riskEvents.length
      ? `Risk-related events in ${joinLocalized(riskMarkets, locale)} are driven by ${joinLocalized(riskTypes, locale)} signals in the current stream.`
      : "No repeated risk pattern is strong enough in the current event stream.";

  return {
    core_signal: localizedCore,
    market_trend: localizedTrend,
    risk_signal: localizedRisk,
    confidence,
    based_on_events: support.map((event) => event.id),
    support_count: support.length,
    data_scope: support.every((event) => event.is_seed)
      ? "seed"
      : support.every((event) => !event.is_seed)
        ? "live"
        : "mixed",
    generated_at: new Date().toISOString()
  };
}

export function selectInsightEvents(events: StoredEvent[]) {
  const liveEvents = events.filter((event) => !event.is_seed);
  if (liveEvents.length >= 3) return liveEvents;
  return events;
}
