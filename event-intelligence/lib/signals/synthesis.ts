import { insertEvent, listUnprocessedSignals, markSignalsProcessed } from "@/lib/db";
import type { EventType, ExtractedEvent } from "@/lib/events/types";
import type { StoredSignal } from "./types";

export type SignalSynthesisSummary = {
  clusters: number;
  synthesized: number;
  duplicate: number;
  skipped: number;
};

function dateBucket(signal: StoredSignal) {
  const value = signal.timestamp || signal.created_at;
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return "unknown";
  const threeDays = 3 * 24 * 60 * 60 * 1000;
  return String(Math.floor(time / threeDays));
}

function clusterKey(signal: StoredSignal) {
  return [
    signal.entity_guess || "GLOBAL_ENTITY",
    signal.market_guess || "GLOBAL_MARKET",
    signal.signal_type,
    dateBucket(signal)
  ].join("|");
}

function firstSentence(text: string) {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?。！？])\s+/)
    .find(Boolean)
    ?.slice(0, 260)
    .trim() || "";
}

function eventTypeFromSignals(signals: StoredSignal[]): EventType {
  const text = signals.map((signal) => `${signal.raw_title} ${signal.raw_text}`).join("\n");
  const type = signals[0]?.signal_type;

  if (type === "PRODUCTION_SIGNAL") return "factory";
  if (type === "PRICE_SIGNAL") return "pricing";
  if (type === "EXPORT_SIGNAL") return "export";
  if (type === "INVESTMENT_SIGNAL") return "investment";
  if (type === "POLICY_SIGNAL") return /tariff|duty|duties|anti-subsidy|关税|反补贴/i.test(text) ? "tariff" : "policy";
  if (type === "REGULATORY_SIGNAL") return /recall|defect|quality issue|complaints?|leak|flooded|detached|failure|fault|召回|缺陷/i.test(text) ? "recall" : "regulation";
  if (/charging|charger|battery swap|800v|充电|换电|超充/i.test(text)) return "charging";
  if (/partner|partnership|joint venture|合作|合资/i.test(text)) return "partnership";
  return "technology";
}

function impactFromSignals(signals: StoredSignal[], eventType: EventType) {
  const base: Partial<Record<EventType, number>> = {
    tariff: 9,
    factory: 8,
    export: 7,
    investment: 7,
    policy: 7,
    regulation: 6,
    recall: 6,
    pricing: 5,
    partnership: 6,
    charging: 5,
    technology: 5
  };
  const sourceBoost = signals.some((signal) => signal.source_type === "OEM" || signal.source_type === "POLICY") ? 0.7 : 0;
  return Math.min(10, Number(((base[eventType] || 5) + sourceBoost).toFixed(1)));
}

function confidenceFromSignals(signals: StoredSignal[]) {
  const avgStrength = signals.reduce((sum, signal) => sum + signal.signal_strength, 0) / signals.length;
  const sourceDiversity = new Set(signals.map((signal) => signal.source_name)).size / signals.length;
  const layerDiversity = new Set(signals.map((signal) => signal.source_type)).size >= 2 ? 0.08 : 0;
  return Math.min(1, Number((avgStrength * 0.68 + sourceDiversity * 0.22 + Math.min(signals.length, 5) / 5 * 0.1 + layerDiversity).toFixed(2)));
}

function synthesizeCluster(signals: StoredSignal[]): ExtractedEvent {
  const sorted = [...signals].sort((a, b) => b.signal_strength - a.signal_strength || a.source_name.localeCompare(b.source_name));
  const primary = sorted[0];
  const eventType = eventTypeFromSignals(sorted);
  const evidence = sorted
    .slice(0, 5)
    .map((signal) => `${signal.source_name}: ${signal.raw_title}`)
    .join(" | ");

  return {
    title: primary.raw_title,
    summary: `Signal cluster from ${new Set(sorted.map((signal) => signal.source_name)).size} sources. ${firstSentence(primary.raw_text)}`,
    event_type: eventType,
    company: primary.entity_guess,
    market: primary.market_guess,
    model: null,
    event_date: primary.timestamp,
    impact_score: impactFromSignals(sorted, eventType),
    confidence_score: confidenceFromSignals(sorted),
    source_url: primary.source_url,
    raw_evidence: evidence
  };
}

export async function synthesizeEventsFromSignals(limit = 500): Promise<SignalSynthesisSummary> {
  const signals = await listUnprocessedSignals(limit);
  const groups = new Map<string, StoredSignal[]>();

  for (const signal of signals) {
    const key = clusterKey(signal);
    groups.set(key, [...(groups.get(key) || []), signal]);
  }

  const summary: SignalSynthesisSummary = {
    clusters: groups.size,
    synthesized: 0,
    duplicate: 0,
    skipped: 0
  };

  for (const cluster of groups.values()) {
    const sourceNames = new Set(cluster.map((signal) => signal.source_name));
    if (cluster.length < 2 || sourceNames.size < 2) {
      summary.skipped += 1;
      continue;
    }

    const sorted = [...cluster].sort((a, b) => b.signal_strength - a.signal_strength);
    const event = synthesizeCluster(sorted);
    const sourcePriority = sorted.reduce((sum, signal) => sum + signal.signal_strength * 10, 0) / sorted.length;
    const stored = await insertEvent(event, {
      content: sorted.map((signal) => `[${signal.source_name}] ${signal.raw_text}`).join("\n\n"),
      source_name: `Signal cluster (${[...sourceNames].slice(0, 3).join(", ")})`,
      source_priority: sourcePriority,
      source_category: "signal_cluster",
      signal_ids: sorted.map((signal) => signal.id)
    });

    await markSignalsProcessed(sorted.map((signal) => signal.id), stored.event.id);
    summary[stored.status === "stored" ? "synthesized" : "duplicate"] += 1;
  }

  return summary;
}
