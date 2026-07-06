import { getRecentSignalCountsByType } from "@/lib/db";
import { loadSourcesConfig } from "@/ingestion/sourceConfig";
import { SIGNAL_COVERAGE_TARGETS, SIGNAL_SOURCE_WEIGHTS, sourceTypeFromConfig } from "./sourceLayer";
import type { SignalCoverageLayer, SignalSourceType } from "./types";

const SOURCE_TYPES: SignalSourceType[] = ["OEM", "POLICY", "MEDIA", "CHINA_MEDIA", "MACRO"];

export async function computeSignalCoverage() {
  const sources = loadSourcesConfig();
  const recentCounts = await getRecentSignalCountsByType();

  const layers: SignalCoverageLayer[] = SOURCE_TYPES.map((sourceType) => {
    const configuredSources = sources.filter((source) => sourceTypeFromConfig(source) === sourceType).length;
    const targetSources = SIGNAL_COVERAGE_TARGETS[sourceType].length;
    const recentSignals = recentCounts.get(sourceType) || 0;
    const configuredCoverage = targetSources ? configuredSources / targetSources : 0;
    const activityCoverage = Math.min(1, recentSignals / Math.max(1, Math.ceil(targetSources * 0.25)));
    const coverage = Math.min(1, Number((configuredCoverage * 0.65 + activityCoverage * 0.35).toFixed(2)));

    return {
      source_type: sourceType,
      weight: SIGNAL_SOURCE_WEIGHTS[sourceType],
      configured_sources: configuredSources,
      target_sources: targetSources,
      recent_signals_24h: recentSignals,
      coverage
    };
  });

  const weightedTotal = layers.reduce((sum, layer) => sum + layer.coverage * layer.weight, 0);
  const weightTotal = layers.reduce((sum, layer) => sum + layer.weight, 0);

  return {
    layers,
    overall_coverage: Number((weightedTotal / weightTotal).toFixed(2)),
    generated_at: new Date().toISOString()
  };
}
