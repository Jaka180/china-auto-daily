import { validateExtractedEvent } from "./validation";
import { decodeHtmlEntities } from "../text";
import type { EventType, ExtractedEvent, RawNews } from "./types";

export const EVENT_EXTRACTION_SYSTEM_PROMPT = `You are an Event Extraction Engine for TopChinaCar.com.
Your task:
Extract structured automotive industry events from raw news text.
You MUST follow strict rules:
- Only use information explicitly present in the source text
- NEVER infer, guess, or hallucinate missing facts
- If a field is not explicitly available, return null
- Do NOT merge multiple events into one
- Do NOT write opinions or analysis
- Do NOT summarize beyond factual extraction
---
OUTPUT FORMAT (STRICT JSON):
{
  "title": "string",
  "summary": "string (max 2 sentences, factual only)",
  "event_type": "one of allowed enums",
  "company": "string or null",
  "market": "string or null",
  "model": "string or null",
  "event_date": "ISO date or null",
  "source_url": "string",
  "impact_score": number (0-10),
  "confidence_score": number (0-1),
  "raw_evidence": "short quote from input text"
}
---
EVENT TYPE ENUM (MUST MATCH EXACTLY):
launch, export, sales_update, factory, partnership, policy,
tariff, pricing, recall, investment, regulation,
dealer_expansion, technology, charging, localization
---
SCORING RULES:
confidence_score:
- 0.9-1.0 -> explicit fact in text
- 0.6-0.8 -> partial ambiguity but still explicit
- <0.6 -> unclear entity or missing key fields
impact_score:
- 8-10 -> industry-wide impact (tariff, factory, export shift)
- 5-7 -> company-level strategic move
- 1-4 -> minor update or announcement
---
CRITICAL RULES:
- NEVER invent company names
- NEVER infer market unless explicitly mentioned
- NEVER combine multiple news into one event
- ALWAYS include source_url
- ALWAYS include raw_evidence (verbatim quote from input)`;

const COMPANY_ALIASES: Array<{ name: string; aliases: string[]; type: "OEM" | "Startup" | "Supplier" }> = [
  { name: "BYD", aliases: ["BYD", "比亚迪"], type: "OEM" },
  { name: "Geely", aliases: ["Geely", "吉利", "Zeekr", "极氪", "Lynk & Co", "领克", "Polestar", "Volvo", "Lotus"], type: "OEM" },
  { name: "SAIC", aliases: ["SAIC", "上汽", "MG", "Maxus", "IM Motors"], type: "OEM" },
  { name: "Chery", aliases: ["Chery", "奇瑞", "Omoda", "Jaecoo", "Exeed"], type: "OEM" },
  { name: "Great Wall Motor", aliases: ["Great Wall", "GWM", "长城", "Haval", "哈弗", "Tank", "坦克", "Wey", "魏牌", "Ora", "欧拉"], type: "OEM" },
  { name: "NIO", aliases: ["NIO", "蔚来", "Onvo", "Firefly"], type: "Startup" },
  { name: "Xpeng", aliases: ["Xpeng", "XPeng", "小鹏"], type: "Startup" },
  { name: "Li Auto", aliases: ["Li Auto", "理想"], type: "Startup" },
  { name: "Xiaomi Auto", aliases: ["Xiaomi", "小米"], type: "Startup" },
  { name: "Leapmotor", aliases: ["Leapmotor", "零跑"], type: "Startup" },
  { name: "CATL", aliases: ["CATL", "宁德时代"], type: "Supplier" },
  { name: "Huawei", aliases: ["Huawei", "华为", "Harmony Intelligent Mobility"], type: "Supplier" }
];

const MARKET_ALIASES: Array<{ name: string; region: string; aliases: string[] }> = [
  { name: "Europe", region: "Europe", aliases: ["Europe", "European Union", "EU", "Germany", "France", "Spain", "Italy", "Hungary", "Norway", "UK", "Britain", "欧洲", "欧盟", "德国", "法国", "西班牙", "匈牙利"] },
  { name: "Thailand", region: "Southeast Asia", aliases: ["Thailand", "泰国"] },
  { name: "Indonesia", region: "Southeast Asia", aliases: ["Indonesia", "印尼", "印度尼西亚"] },
  { name: "Southeast Asia", region: "Southeast Asia", aliases: ["Southeast Asia", "ASEAN", "东南亚", "东盟"] },
  { name: "Brazil", region: "Latin America", aliases: ["Brazil", "Brasil", "巴西"] },
  { name: "Mexico", region: "Latin America", aliases: ["Mexico", "墨西哥"] },
  { name: "Latin America", region: "Latin America", aliases: ["Latin America", "LatAm", "拉美", "拉丁美洲"] },
  { name: "Middle East", region: "Middle East", aliases: ["Middle East", "Gulf", "GCC", "中东", "海湾"] },
  { name: "Saudi Arabia", region: "Middle East", aliases: ["Saudi Arabia", "Saudi", "KSA", "沙特"] },
  { name: "UAE", region: "Middle East", aliases: ["UAE", "Dubai", "Abu Dhabi", "阿联酋", "迪拜"] },
  { name: "Africa", region: "Africa", aliases: ["Africa", "South Africa", "Egypt", "Morocco", "非洲", "南非", "埃及", "摩洛哥"] },
  { name: "Australia", region: "Oceania", aliases: ["Australia", "New Zealand", "澳大利亚", "澳洲", "新西兰"] },
  { name: "China", region: "China", aliases: ["China", "Chinese market", "中国", "国内"] },
  { name: "United States", region: "North America", aliases: ["United States", "US", "U.S.", "USA", "America", "美国"] }
];

const MODEL_ALIASES = [
  "Seal",
  "Atto 3",
  "Seagull",
  "Shark 6",
  "SU7",
  "SU7 Ultra",
  "ET5",
  "ET9",
  "Onvo L60",
  "G6",
  "Mona M03",
  "C10",
  "B10",
  "MG4",
  "Cyberster",
  "Tiggo 8",
  "Galaxy E5",
  "001",
  "7X",
  "Bao 5",
  "Tank 300",
  "Mifa 9"
];

const EVENT_RULES: Array<{ type: EventType; score: number; words: RegExp[] }> = [
  { type: "tariff", score: 8, words: [/tariff|duty|duties|anti-subsidy|anti subsidy|关税|反补贴/i] },
  { type: "factory", score: 8, words: [/factory|plant|production base|assembly|manufacturing|工厂|投产|生产基地|组装/i] },
  { type: "investment", score: 7, words: [/invest|investment|funding|stake|acquire|acquisition|投资|入股|收购/i] },
  { type: "partnership", score: 6, words: [/partner|partnership|joint venture|合作|合资/i] },
  { type: "recall", score: 5, words: [/recall|defect|quality issue|complaints?|leak|flooded|detached|failure|fault|召回|缺陷|质量问题|漏水|脱落|故障/i] },
  { type: "launch", score: 6, words: [/launch|unveil|debut|release|goes on sale|发布|上市|亮相/i] },
  { type: "sales_update", score: 5, words: [/sales|deliveries|deliver|sold|registrations|销量|交付|上牌/i] },
  { type: "export", score: 7, words: [/export|shipment|overseas sales|ro-ro|出口|出海|海外/i] },
  { type: "policy", score: 6, words: [/policy|subsidy|incentive|政府|政策|补贴/i] },
  { type: "regulation", score: 6, words: [/regulation|regulatory|homologation|certification|rule|认证|法规|监管/i] },
  { type: "pricing", score: 4, words: [/price|pricing|discount|starts at|售价|价格|降价/i] },
  { type: "dealer_expansion", score: 5, words: [/dealer|showroom|retail network|经销商|门店|展厅/i] },
  { type: "technology", score: 5, words: [/technology|ADAS|software|autonomous|smart driving|battery|技术|智驾|软件|电池/i] },
  { type: "charging", score: 5, words: [/charging|charger|swap|battery swap|supercharging|充电|换电|超充/i] },
  { type: "localization", score: 6, words: [/localization|localisation|local production|localized|本地化|本地生产/i] }
];

function containsAlias(text: string, aliases: string[]) {
  return aliases.some((alias) => {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(text);
  });
}

function firstSentence(text: string) {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?。！？])\s+/)
    .find(Boolean)
    ?.slice(0, 260)
    .trim();
}

function sentenceCandidates(text: string) {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?。！？])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function detectCompany(text: string) {
  return COMPANY_ALIASES.find((company) => containsAlias(text, company.aliases)) || null;
}

function detectMarket(text: string) {
  return MARKET_ALIASES.find((market) => containsAlias(text, market.aliases)) || null;
}

function detectModel(text: string) {
  return MODEL_ALIASES.find((model) => containsAlias(text, [model])) || null;
}

function detectEventType(text: string) {
  const matches = EVENT_RULES.map((rule) => ({
    type: rule.type,
    impact: rule.score,
    matched: rule.words.some((word) => word.test(text))
  })).filter((match) => match.matched);

  return matches[0] || null;
}

function detectDate(raw: RawNews) {
  if (raw.published_at && !Number.isNaN(new Date(raw.published_at).getTime())) {
    return new Date(raw.published_at).toISOString();
  }

  const match = `${raw.title} ${raw.content}`.match(/\b(20\d{2})[-/](0?[1-9]|1[0-2])[-/](0?[1-9]|[12]\d|3[01])\b/);
  if (match) {
    const [, year, month, day] = match;
    return new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T00:00:00Z`).toISOString();
  }

  return null;
}

function calculateConfidence(parts: {
  company: string | null;
  eventType: EventType | null;
  market: string | null;
  model: string | null;
  hasSource: boolean;
  hasSummary: boolean;
}) {
  let score = 0;
  if (parts.company) score += 0.3;
  if (parts.eventType) score += 0.25;
  if (parts.hasSource) score += 0.2;
  if (parts.hasSummary) score += 0.1;
  if (parts.market) score += 0.1;
  if (parts.model) score += 0.05;
  return Math.min(1, Number(score.toFixed(2)));
}

function pickRawEvidence(raw: RawNews, type: ReturnType<typeof detectEventType>, companyName: string | null) {
  const sentences = sentenceCandidates(raw.content);
  const matched = sentences.find((sentence) => {
    const hasCompany = companyName ? containsAlias(sentence, [companyName]) : true;
    const hasType = type ? type.matched && EVENT_RULES.find((rule) => rule.type === type.type)?.words.some((word) => word.test(sentence)) : false;
    return hasCompany && hasType;
  });
  return (matched || sentences[0] || raw.title).slice(0, 320);
}

async function extractWithOptionalLlm(_raw: RawNews): Promise<unknown | null> {
  if (!process.env.LLM_API_URL || !process.env.LLM_API_KEY || !process.env.LLM_MODEL) return null;
  // Provider-specific adapters can be added here. The deterministic extractor
  // remains the fallback and all outputs must pass validateExtractedEvent.
  return null;
}

export async function extractEvent(raw: RawNews) {
  const normalizedRaw: RawNews = {
    ...raw,
    title: decodeHtmlEntities(raw.title),
    content: decodeHtmlEntities(raw.content)
  };
  const llmOutput = await extractWithOptionalLlm(raw);
  if (llmOutput) {
    const validated = validateExtractedEvent({ ...(llmOutput as object), source_url: normalizedRaw.source_url });
    if (validated.ok) return validated;
  }

  const text = `${normalizedRaw.title}\n${normalizedRaw.content}`;
  const company = detectCompany(text);
  const market = detectMarket(text);
  const model = detectModel(text);
  const type = detectEventType(text);
  const summary = firstSentence(normalizedRaw.content) || firstSentence(normalizedRaw.title);
  const rawEvidence = pickRawEvidence(normalizedRaw, type, company?.name || null);
  const confidence = calculateConfidence({
    company: company?.name || null,
    eventType: type?.type || null,
    market: market?.name || null,
    model,
    hasSource: Boolean(raw.source_url),
    hasSummary: Boolean(summary)
  });

  if (!type) return { ok: false as const, error: "event_type could not be extracted" };
  if (!summary) return { ok: false as const, error: "summary could not be extracted" };
  if (!rawEvidence) return { ok: false as const, error: "raw_evidence could not be extracted" };

  const candidate: ExtractedEvent = {
    title: normalizedRaw.title,
    summary,
    event_type: type.type,
    company: company?.name || null,
    market: market?.name || null,
    model,
    event_date: detectDate(raw),
    impact_score: type.impact,
    confidence_score: confidence,
    source_url: normalizedRaw.source_url,
    raw_evidence: rawEvidence
  };

  return validateExtractedEvent(candidate);
}

export function knownCompanySeed(name: string) {
  return COMPANY_ALIASES.find((company) => company.name.toLowerCase() === name.toLowerCase()) || null;
}

export function knownMarketSeed(name: string | null) {
  if (!name) return null;
  return MARKET_ALIASES.find((market) => market.name.toLowerCase() === name.toLowerCase()) || null;
}
