import type { RawNews } from "../lib/events/types";
import type { SourceConfig } from "./sourceConfig";

export const TRIGGER_KEYWORDS = {
  oem: [
    "BYD",
    "Geely",
    "Chery",
    "SAIC",
    "Great Wall",
    "XPeng",
    "Xpeng",
    "NIO",
    "Li Auto",
    "Leapmotor",
    "Dongfeng",
    "ChangAn",
    "Changan",
    "GWM",
    "MG",
    "Zeekr",
    "Xiaomi"
  ],
  evTerms: [
    "electric vehicle",
    "electric vehicles",
    "EV",
    "BEV",
    "PHEV",
    "NEV",
    "battery",
    "lithium"
  ],
  businessTerms: [
    "export",
    "shipment",
    "factory",
    "plant",
    "investment",
    "JV",
    "joint venture",
    "partnership",
    "launch",
    "tariff",
    "policy",
    "pricing",
    "recall",
    "dealer",
    "localization",
    "localisation"
  ],
  markets: [
    "Europe",
    "EU",
    "Thailand",
    "Indonesia",
    "Middle East",
    "Latin America",
    "Brazil",
    "Saudi",
    "UAE",
    "Africa",
    "Australia"
  ]
} as const;

const OPINION_REVIEW_NOISE = [
  /\bopinion\b/i,
  /\bcolumn\b/i,
  /\bcommentary\b/i,
  /\bwhat we think\b/i,
  /\btest drive\b/i,
  /\bfirst drive\b/i,
  /\breview\b/i,
  /\bdriven\b/i,
  /\bhands-on\b/i
];

const STRONG_SIGNAL = [
  /\bfactory\b|\bplant\b|\bassembly\b|\bproduction\b/i,
  /\bexport\b|\bshipment\b|\bdeliveries\b/i,
  /\bprice\b|\bpricing\b|\bdiscount\b/i,
  /\bpolicy\b|\btariff\b|\bregulation\b|\bduties\b/i,
  /\bpartnership\b|\bjoint venture\b|\bJV\b/i,
  /\blaunch\b|\bunveil\b|\bdebut\b|\bgoes on sale\b/i,
  /\bmarket entry\b|\benters?\b|\bexit\b|\bwithdraw\b/i,
  /\binvestment\b|\binvests?\b|\bacquisition\b/i,
  /\brecall\b/i
];

function includesKeyword(text: string, keyword: string) {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(text);
}

function countMatches(text: string, keywords: readonly string[]) {
  return keywords.filter((keyword) => includesKeyword(text, keyword)).length;
}

export function domainKeywordScore(raw: RawNews) {
  const text = `${raw.title}\n${raw.content}`;
  const oem = countMatches(text, TRIGGER_KEYWORDS.oem);
  const ev = countMatches(text, TRIGGER_KEYWORDS.evTerms);
  const business = countMatches(text, TRIGGER_KEYWORDS.businessTerms);
  const market = countMatches(text, TRIGGER_KEYWORDS.markets);
  return { oem, ev, business, market, total: oem * 3 + ev + business * 2 + market };
}

export function hasStrongSignal(raw: RawNews) {
  const text = `${raw.title}\n${raw.content}`;
  return STRONG_SIGNAL.some((rule) => rule.test(text));
}

export function isNoiseArticle(raw: RawNews) {
  const text = `${raw.title}\n${raw.content}`;
  const reviewNoise = OPINION_REVIEW_NOISE.some((rule) => rule.test(text));
  return reviewNoise && !hasStrongSignal(raw);
}

export function shouldKeepForExtraction(raw: RawNews, source: Pick<SourceConfig, "priority" | "category">) {
  const score = domainKeywordScore(raw);
  if (isNoiseArticle(raw)) {
    return { keep: false as const, reason: "opinion_or_review_without_industry_signal", score };
  }
  if (score.oem === 0) {
    return { keep: false as const, reason: "no_company_mention", score };
  }
  if (!hasStrongSignal(raw) && score.business === 0) {
    return { keep: false as const, reason: "no_event_signal", score };
  }

  const minScore = source.priority >= 8 ? 3 : 5;
  if (score.total < minScore) {
    return { keep: false as const, reason: "below_keyword_threshold", score };
  }

  return { keep: true as const, reason: "matched_domain_filter", score };
}
