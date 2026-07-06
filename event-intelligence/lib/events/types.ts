import { z } from "zod";

export const EVENT_TYPES = [
  "launch",
  "export",
  "sales_update",
  "factory",
  "partnership",
  "policy",
  "tariff",
  "pricing",
  "recall",
  "investment",
  "regulation",
  "dealer_expansion",
  "technology",
  "charging",
  "localization"
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export const eventTypeSchema = z.enum(EVENT_TYPES);

export const rawNewsSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  source_url: z.string().url(),
  source_name: z.string().nullish(),
  published_at: z.string().nullish(),
  source_priority: z.number().int().min(1).max(10).nullish(),
  source_category: z.string().nullish(),
  source_region: z.string().nullish()
});

export type RawNews = z.infer<typeof rawNewsSchema>;

export const extractedEventSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  event_type: eventTypeSchema,
  company: z.string().min(1).nullable(),
  market: z.string().nullable(),
  model: z.string().nullable(),
  event_date: z.string().min(1).nullable(),
  impact_score: z.number().min(0).max(10),
  confidence_score: z.number().min(0).max(1),
  source_url: z.string().url(),
  raw_evidence: z.string().min(1)
});

export type ExtractedEvent = z.infer<typeof extractedEventSchema>;

export type StoredEvent = ExtractedEvent & {
  id: string;
  slug: string;
  article_hash: string | null;
  review_status: ReviewStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  source_name: string | null;
  source_priority: number;
  source_category: string | null;
  final_score: number;
  is_seed: boolean;
  signal_ids: string[] | null;
  signal_count: number;
  raw_content: string;
  low_confidence: boolean;
  created_at: string;
};

export const REVIEW_STATUSES = ["pending", "published", "rejected", "needs_fix"] as const;

export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export type EventFilters = {
  company?: string;
  market?: string;
  type?: EventType;
  reviewStatus?: ReviewStatus | "all";
  limit?: number;
};
