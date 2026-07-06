import { formatScore } from "@/lib/events/scoring";
import type { StoredEvent } from "@/lib/events/types";
import type { Locale } from "@/lib/i18n";

type ReaderCopy = {
  label: string;
  detail: string;
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
      label: pick(locale, "High-impact signal", "高影响信号"),
      detail: pick(
        locale,
        "This event matters because it may affect policy, capacity, exports or market entry.",
        "该事件值得关注，因为它可能影响政策、产能、出口或市场进入。"
      )
    };
  }

  if (finalHigh) {
    return {
      label: pick(locale, "Important market signal", "重要市场信号"),
      detail: pick(
        locale,
        "The system ranks this above routine updates in the current feed.",
        "系统将该事件排在常规更新之上，说明它具备较强市场信号。"
      )
    };
  }

  if (event.final_score >= 4.8) {
    return {
      label: pick(locale, "Market movement", "市场动向"),
      detail: pick(
        locale,
        "Relevant movement for company, region or channel tracking.",
        "适合用于跟踪企业、区域或渠道层面的变化。"
      )
    };
  }

  return {
    label: pick(locale, "Context signal", "背景信号"),
    detail: pick(locale, "Useful for context, but not yet a leading market signal.", "可作为背景观察，但暂未构成主导市场信号。")
  };
}

export function readerScorePillars(event: StoredEvent, locale: Locale): ReaderCopy[] {
  const impact: ReaderCopy =
    event.impact_score >= 7
      ? {
        label: pick(locale, "Industry impact: high", "行业影响：高"),
        detail: pick(locale, "Policy, factory, export or market-access relevance.", "涉及政策、工厂、出口或市场进入等核心变量。")
      }
      : event.impact_score >= 5
        ? {
          label: pick(locale, "Industry impact: medium", "行业影响：中"),
          detail: pick(locale, "Company or market-level movement.", "属于企业或市场层面的变化。")
        }
        : {
          label: pick(locale, "Industry impact: low", "行业影响：低"),
          detail: pick(locale, "Background update with lower immediate impact.", "偏背景更新，短期影响较低。")
        };

  const confidence: ReaderCopy =
    event.confidence_score >= 0.8
      ? {
        label: pick(locale, "Evidence: strong", "证据：较强"),
        detail: pick(locale, "Company, market or event signals are clear.", "公司、市场或事件类型信号较明确。")
      }
      : event.confidence_score >= 0.65
        ? {
          label: pick(locale, "Evidence: medium", "证据：中等"),
          detail: pick(locale, "Some fields remain less explicit.", "部分字段仍存在不确定性。")
        }
        : {
          label: pick(locale, "Evidence: needs review", "证据：待复核"),
          detail: pick(locale, "Treat uncertain fields carefully.", "请谨慎使用不确定字段。")
        };

  const source: ReaderCopy =
    event.source_priority >= 8.5
      ? {
        label: pick(locale, "Source strength: high", "信源强度：高"),
        detail: pick(locale, "Higher-weight source in the system model.", "系统模型中的高权重来源。")
      }
      : event.source_priority >= 7
        ? {
          label: pick(locale, "Source strength: established", "信源强度：稳定"),
          detail: pick(locale, "Tracked source with stable signal value.", "稳定跟踪的有效信号来源。")
        }
        : {
          label: pick(locale, "Source strength: supplementary", "信源强度：补充"),
          detail: pick(locale, "Supplementary source used for context.", "用于补充背景的信号来源。")
        };

  return [impact, confidence, source];
}

export function readerScoreDetails(event: StoredEvent, locale: Locale) {
  return [
    [pick(locale, "Overall signal index", "综合信号指数"), formatScore(event.final_score)],
    [pick(locale, "Industry impact input", "行业影响输入"), formatScore(event.impact_score)],
    [pick(locale, "Evidence confidence", "证据置信度"), `${Math.round(event.confidence_score * 100)}%`],
    [pick(locale, "Source weight", "信源权重"), formatScore(event.source_priority)]
  ] as const;
}

export function scoreDetailsLabel(locale: Locale) {
  return pick(locale, "View system score details", "查看系统评分明细");
}

export function systemReadingLabel(locale: Locale) {
  return pick(locale, "System reading", "系统判断");
}
