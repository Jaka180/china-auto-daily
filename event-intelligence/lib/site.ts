export const MAIN_SITE_URL = process.env.NEXT_PUBLIC_MAIN_SITE_URL || "https://www.topchinacar.com";
export const EVENT_APP_URL = process.env.NEXT_PUBLIC_EVENT_APP_URL || "https://topchinacar-event-intelligence.vercel.app";

export function mainSitePath(path: string, locale: "en" | "zh" = "en") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${MAIN_SITE_URL}${locale === "zh" ? "/zh" : ""}${normalizedPath}`;
}
