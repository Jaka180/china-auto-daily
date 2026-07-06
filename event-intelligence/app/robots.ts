import type { MetadataRoute } from "next";
import { EVENT_APP_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/ingest/"]
    },
    sitemap: `${EVENT_APP_URL}/sitemap.xml`
  };
}
