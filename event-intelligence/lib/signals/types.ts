import { z } from "zod";

export const signalSourceTypeSchema = z.enum(["OEM", "POLICY", "MEDIA", "CHINA_MEDIA", "MACRO"]);
export type SignalSourceType = z.infer<typeof signalSourceTypeSchema>;

export const signalTypeSchema = z.enum([
  "FACT_SIGNAL",
  "POLICY_SIGNAL",
  "PRICE_SIGNAL",
  "EXPORT_SIGNAL",
  "INVESTMENT_SIGNAL",
  "PRODUCTION_SIGNAL",
  "REGULATORY_SIGNAL"
]);
export type SignalType = z.infer<typeof signalTypeSchema>;

export type NormalizedSignal = {
  source_type: SignalSourceType;
  source_name: string;
  source_url: string;
  raw_title: string;
  raw_text: string;
  timestamp: string | null;
  signal_strength: number;
  signal_type: SignalType;
  entity_guess: string | null;
  market_guess: string | null;
};

export type StoredSignal = NormalizedSignal & {
  id: string;
  signal_hash: string;
  processed: boolean;
  event_id: string | null;
  created_at: string;
};

export type SignalCoverageLayer = {
  source_type: SignalSourceType;
  weight: number;
  configured_sources: number;
  target_sources: number;
  recent_signals_24h: number;
  coverage: number;
};
