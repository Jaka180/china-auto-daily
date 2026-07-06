import type { SourceConfig } from "@/ingestion/sourceConfig";
import { domainKeywordScore, hasStrongSignal } from "@/ingestion/filterRules";
import type { RawNews } from "@/lib/events/types";
import { decodeHtmlEntities } from "@/lib/text";
import { signalWeightForSource, sourceTypeFromConfig } from "./sourceLayer";
import type { NormalizedSignal, SignalType } from "./types";

const COMPANY_ALIASES: Array<{ name: string; aliases: string[] }> = [
  { name: "BYD", aliases: ["BYD", "比亚迪"] },
  { name: "Geely", aliases: ["Geely", "吉利", "Zeekr", "极氪", "Lynk & Co", "领克", "Polestar", "Volvo", "Lotus"] },
  { name: "SAIC", aliases: ["SAIC", "上汽", "MG", "Maxus", "IM Motors", "智己"] },
  { name: "Changan", aliases: ["Changan", "ChangAn", "长安", "Deepal", "深蓝", "Avatr", "阿维塔"] },
  { name: "Great Wall", aliases: ["Great Wall", "GWM", "长城", "Haval", "哈弗", "Tank", "坦克", "Wey", "魏牌", "Ora", "欧拉"] },
  { name: "Chery", aliases: ["Chery", "奇瑞", "Omoda", "Jaecoo", "Exeed"] },
  { name: "FAW", aliases: ["FAW", "一汽", "Hongqi", "红旗"] },
  { name: "Dongfeng", aliases: ["Dongfeng", "东风", "Voyah", "岚图"] },
  { name: "GAC", aliases: ["GAC", "广汽", "Aion", "埃安", "Hyptec", "昊铂"] },
  { name: "BAIC", aliases: ["BAIC", "北汽", "Arcfox", "极狐"] },
  { name: "JAC", aliases: ["JAC", "江淮"] },
  { name: "XPeng", aliases: ["XPeng", "Xpeng", "小鹏"] },
  { name: "NIO", aliases: ["NIO", "蔚来", "Onvo", "Firefly"] },
  { name: "Li Auto", aliases: ["Li Auto", "理想"] },
  { name: "Leapmotor", aliases: ["Leapmotor", "零跑"] },
  { name: "AITO", aliases: ["AITO", "问界"] },
  { name: "Xiaomi Auto", aliases: ["Xiaomi", "小米"] },
  { name: "Tesla", aliases: ["Tesla", "特斯拉"] }
];

const MARKET_ALIASES: Array<{ name: string; aliases: string[] }> = [
  { name: "Europe", aliases: ["Europe", "European Union", "EU", "Germany", "France", "Spain", "Italy", "Hungary", "Norway", "UK", "Britain", "欧洲", "欧盟"] },
  { name: "Thailand", aliases: ["Thailand", "泰国"] },
  { name: "Indonesia", aliases: ["Indonesia", "印尼", "印度尼西亚"] },
  { name: "Southeast Asia", aliases: ["Southeast Asia", "ASEAN", "东南亚", "东盟"] },
  { name: "Brazil", aliases: ["Brazil", "Brasil", "巴西"] },
  { name: "Mexico", aliases: ["Mexico", "墨西哥"] },
  { name: "Latin America", aliases: ["Latin America", "LatAm", "拉美", "拉丁美洲"] },
  { name: "Middle East", aliases: ["Middle East", "Gulf", "GCC", "中东", "海湾"] },
  { name: "Saudi Arabia", aliases: ["Saudi Arabia", "Saudi", "KSA", "沙特"] },
  { name: "UAE", aliases: ["UAE", "Dubai", "Abu Dhabi", "阿联酋", "迪拜"] },
  { name: "Africa", aliases: ["Africa", "South Africa", "Egypt", "Morocco", "非洲", "南非", "埃及", "摩洛哥"] },
  { name: "Australia", aliases: ["Australia", "New Zealand", "澳大利亚", "澳洲", "新西兰"] },
  { name: "China", aliases: ["China", "Chinese market", "Zhengzhou", "中国", "国内", "郑州"] },
  { name: "United States", aliases: ["United States", "US", "U.S.", "USA", "America", "美国"] }
];

function containsAlias(text: string, aliases: string[]) {
  return aliases.some((alias) => {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(text);
  });
}

function detectEntity(text: string) {
  return COMPANY_ALIASES.find((company) => containsAlias(text, company.aliases))?.name || null;
}

function detectMarket(text: string) {
  return MARKET_ALIASES.find((market) => containsAlias(text, market.aliases))?.name || null;
}

function classifySignalType(text: string): SignalType {
  if (/tariff|duty|duties|anti-subsidy|subsidy|policy|commission|miit|customs|wto|关税|反补贴|政策|补贴|海关|工信部/i.test(text)) {
    return "POLICY_SIGNAL";
  }
  if (/regulation|regulatory|homologation|certification|recall|defect|quality issue|complaints?|leak|flooded|detached|failure|fault|法规|监管|认证|召回|缺陷|质量问题/i.test(text)) {
    return "REGULATORY_SIGNAL";
  }
  if (/price|pricing|discount|starts at|售价|价格|降价/i.test(text)) return "PRICE_SIGNAL";
  if (/export|shipment|overseas sales|ro-ro|出口|出海|海外/i.test(text)) return "EXPORT_SIGNAL";
  if (/invest|investment|funding|stake|acquire|acquisition|投资|入股|收购/i.test(text)) return "INVESTMENT_SIGNAL";
  if (/factory|plant|production base|assembly|manufacturing|rolls off|工厂|投产|生产基地|组装|下线/i.test(text)) return "PRODUCTION_SIGNAL";
  return "FACT_SIGNAL";
}

function normalizedTimestamp(raw: RawNews) {
  if (raw.published_at && !Number.isNaN(new Date(raw.published_at).getTime())) {
    return new Date(raw.published_at).toISOString();
  }
  return new Date().toISOString();
}

export function normalizeSignal(raw: RawNews, source: SourceConfig): NormalizedSignal {
  const title = decodeHtmlEntities(raw.title);
  const content = decodeHtmlEntities(raw.content);
  const rawText = `${title}\n${content}`.trim();
  const score = domainKeywordScore({ ...raw, title, content });
  const sourceWeight = signalWeightForSource(source);
  const signalStrength = Math.min(1, Number((sourceWeight * (0.55 + Math.min(score.total, 10) / 20 + (hasStrongSignal(raw) ? 0.12 : 0))).toFixed(2)));

  return {
    source_type: sourceTypeFromConfig(source),
    source_name: raw.source_name || source.name,
    source_url: raw.source_url,
    raw_title: title,
    raw_text: rawText,
    timestamp: normalizedTimestamp(raw),
    signal_strength: signalStrength,
    signal_type: classifySignalType(rawText),
    entity_guess: detectEntity(rawText),
    market_guess: detectMarket(rawText)
  };
}
