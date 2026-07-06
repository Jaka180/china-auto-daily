import type { SystemInsight } from "@/lib/insightGenerator";
import { localeDate, t, type Locale } from "@/lib/i18n";

function confidenceLabel(confidence: number, locale: Locale) {
  const copy = t(locale);
  if (confidence >= 0.75) return copy.highConfidence;
  if (confidence >= 0.6) return copy.mediumHighConfidence;
  if (confidence >= 0.45) return copy.mediumConfidence;
  return copy.lowConfidenceLabel;
}

function formatUpdated(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(localeDate(locale), {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function dataScopeLabel(scope: SystemInsight["data_scope"], locale: Locale) {
  const copy = t(locale);
  if (scope === "live") return copy.insightScopeLive;
  if (scope === "mixed") return copy.insightScopeMixed;
  return copy.insightScopeSeed;
}

export function InsightHeader({ insight, locale = "en" }: { insight: SystemInsight | null; locale?: Locale }) {
  const copy = t(locale);
  return (
    <section className="mt-8 border-y border-ink bg-ink px-5 py-6 text-white">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">{copy.topChinaAuto}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight">{copy.systemInterpretation}</h2>

      {!insight ? (
        <p className="mt-4 max-w-3xl text-sm leading-6 text-white/75">
          {copy.insufficientInsight}
        </p>
      ) : (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="border-l border-white/25 pl-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-white/60">{copy.coreSignal}</dt>
            <dd className="mt-1 text-base leading-7">{insight.core_signal}</dd>
          </div>
          <div className="border-l border-white/25 pl-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-white/60">{copy.marketTrend}</dt>
            <dd className="mt-1 text-base leading-7">{insight.market_trend}</dd>
          </div>
          <div className="border-l border-white/25 pl-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-white/60">{copy.riskSignal}</dt>
            <dd className="mt-1 text-base leading-7">{insight.risk_signal}</dd>
          </div>
          <div className="border-l border-white/25 pl-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-white/60">{copy.systemConfidence}</dt>
            <dd className="mt-1 text-base leading-7">
              {insight.confidence.toFixed(2)} ({confidenceLabel(insight.confidence, locale)})
            </dd>
            <dt className="mt-3 text-xs font-semibold uppercase tracking-wide text-white/60">{copy.lastUpdated}</dt>
            <dd className="mt-1 text-sm text-white/80">{formatUpdated(insight.generated_at, locale)}</dd>
            <dt className="mt-3 text-xs font-semibold uppercase tracking-wide text-white/60">{copy.insightDataScope}</dt>
            <dd className="mt-1 text-sm text-white/80">{dataScopeLabel(insight.data_scope, locale)}</dd>
            <p className="mt-3 text-xs text-white/60">{copy.basedOn} {insight.support_count} {copy.rankedEvents}</p>
          </div>
        </div>
      )}
    </section>
  );
}
