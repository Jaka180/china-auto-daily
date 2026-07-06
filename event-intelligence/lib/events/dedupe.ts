import type { ExtractedEvent, StoredEvent } from "./types";

function normalizeTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function levenshtein(a: string, b: string) {
  const left = normalizeTitle(a);
  const right = normalizeTitle(b);
  const rows = left.length + 1;
  const cols = right.length + 1;
  const dp = Array.from({ length: rows }, () => Array<number>(cols).fill(0));

  for (let i = 0; i < rows; i++) dp[i][0] = i;
  for (let j = 0; j < cols; j++) dp[0][j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[left.length][right.length];
}

export function titleSimilarity(a: string, b: string) {
  const left = normalizeTitle(a);
  const right = normalizeTitle(b);
  const max = Math.max(left.length, right.length);
  if (!max) return 1;
  return 1 - levenshtein(left, right) / max;
}

export function isDuplicateEvent(candidate: ExtractedEvent, existing: Pick<StoredEvent, "title" | "company" | "event_type" | "event_date">) {
  if ((candidate.company || "").toLowerCase() !== (existing.company || "").toLowerCase()) return false;
  if (candidate.event_type !== existing.event_type) return false;
  if (!candidate.event_date || !existing.event_date) return false;

  const candidateDate = new Date(candidate.event_date);
  const existingDate = new Date(existing.event_date);
  if (Number.isNaN(candidateDate.getTime()) || Number.isNaN(existingDate.getTime())) return false;

  const days = Math.abs(candidateDate.getTime() - existingDate.getTime()) / (24 * 60 * 60 * 1000);
  if (days > 3) return false;

  return titleSimilarity(candidate.title, existing.title) > 0.85;
}
