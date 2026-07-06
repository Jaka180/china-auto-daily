import type { SourceConfig } from "@/ingestion/sourceConfig";
import type { SignalSourceType } from "./types";

export const SIGNAL_SOURCE_WEIGHTS: Record<SignalSourceType, number> = {
  OEM: 1,
  POLICY: 0.9,
  MEDIA: 0.8,
  CHINA_MEDIA: 0.7,
  MACRO: 0.6
};

export const SIGNAL_COVERAGE_TARGETS: Record<SignalSourceType, string[]> = {
  OEM: [
    "BYD",
    "Geely",
    "SAIC",
    "Changan",
    "Great Wall",
    "Chery",
    "FAW",
    "Dongfeng",
    "GAC",
    "BAIC",
    "JAC",
    "XPeng",
    "NIO",
    "Li Auto",
    "Leapmotor",
    "Zeekr",
    "Avatr",
    "Deepal",
    "AITO",
    "IM Motors"
  ],
  POLICY: [
    "EU Commission",
    "US DOE",
    "China MIIT",
    "China Customs",
    "WTO trade data",
    "National EV subsidies",
    "Tariff announcements"
  ],
  MEDIA: [
    "Reuters Auto",
    "Bloomberg",
    "Automotive News",
    "InsideEVs",
    "Electrek",
    "CNBC Auto",
    "Financial Times Mobility"
  ],
  CHINA_MEDIA: [
    "CarNewsChina",
    "CnEVPost",
    "36Kr Auto",
    "Yicai Auto",
    "TechNode Mobility"
  ],
  MACRO: [
    "IEA EV Outlook",
    "OICA",
    "EV Volumes",
    "World Bank transport data",
    "EU transport statistics"
  ]
};

export function sourceTypeFromConfig(source: Pick<SourceConfig, "category" | "name" | "priority">): SignalSourceType {
  const category = source.category.toLowerCase();
  const name = source.name.toLowerCase();

  if (category.includes("official") || category.includes("oem")) return "OEM";
  if (category.includes("policy") || /commission|miit|customs|wto|doe|tariff|subsid/.test(name)) return "POLICY";
  if (category.includes("china")) return "CHINA_MEDIA";
  if (category.includes("macro") || /iea|oica|world bank|ev volumes|statistics/.test(name)) return "MACRO";
  return "MEDIA";
}

export function signalWeightForSource(source: Pick<SourceConfig, "category" | "name" | "priority">) {
  return SIGNAL_SOURCE_WEIGHTS[sourceTypeFromConfig(source)];
}
