import type { StoredEvent } from "@/lib/events/types";
import type { Locale } from "@/lib/i18n";

type ReaderCopy = {
  label: string;
};

function pick<T>(locale: Locale, en: T, zh: T) {
  return locale === "zh" ? zh : en;
}

export function readerSignal(event: StoredEvent, locale: Locale) {
  const impactHigh = event.impact_score >= 7;
  const finalHigh = event.final_score >= 6;
  const confidenceMedium = event.confidence_score >= 0.65;

  if (impactHigh && confidenceMedium) {
    return {
      label: pick(locale, "Why it matters", "为何重要"),
      detail: pick(
        locale,
        "This may affect policy, production capacity, exports or overseas market entry.",
        "这可能影响政策、产能、出口或海外市场进入。"
      )
    };
  }

  if (finalHigh) {
    return {
      label: pick(locale, "Why it matters", "为何重要"),
      detail: pick(
        locale,
        "This is more relevant than a routine company update because it points to market or strategy movement.",
        "这不只是常规企业动态，而是指向市场或战略层面的变化。"
      )
    };
  }

  if (event.final_score >= 4.8) {
    return {
      label: pick(locale, "Why it matters", "为何重要"),
      detail: pick(
        locale,
        "This helps track how a company, region or distribution channel is changing.",
        "这有助于观察企业、区域或渠道层面的变化。"
      )
    };
  }

  return {
    label: pick(locale, "Why it matters", "为何重要"),
    detail: pick(locale, "This is useful background for following the China auto market.", "这是理解中国汽车市场变化的背景信息。")
  };
}

export function readerTags(event: StoredEvent, locale: Locale): ReaderCopy[] {
  const movement: ReaderCopy =
    event.impact_score >= 7
      ? {
        label: pick(locale, "Major industry move", "行业重要变化")
      }
      : event.impact_score >= 5
        ? {
          label: pick(locale, "Market movement", "市场动向")
        }
        : {
          label: pick(locale, "Background update", "背景更新")
        };

  const evidence: ReaderCopy =
    event.confidence_score >= 0.65
      ? {
        label: pick(locale, "Source-backed", "有来源支撑")
      }
      : {
        label: pick(locale, "Needs follow-up", "仍需跟踪")
      };

  return [movement, evidence];
}
