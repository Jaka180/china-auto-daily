import type { Metadata } from "next";
import { headers } from "next/headers";
import { EVENT_APP_URL, MAIN_SITE_URL } from "@/lib/site";
import "../styles/globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(EVENT_APP_URL),
  title: {
    default: "TopChinaCar Live Event Intelligence",
    template: "%s | TopChinaCar Live Event Intelligence"
  },
  description: "Structured intelligence system for China automotive global expansion.",
  robots: {
    index: true,
    follow: true
  }
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const requestHeaders = await headers();
  const locale = requestHeaders.get("x-tcc-locale") === "zh" ? "zh-CN" : "en";

  return (
    <html lang={locale}>
      <body className="font-sans antialiased">
        <header className="border-b border-line bg-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <a href={`${MAIN_SITE_URL}/intelligence`} className="font-serif text-xl font-bold tracking-tight text-ink">
              TopChinaCar Intelligence
              <span className="block font-sans text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                Live Event System
              </span>
            </a>
            <nav className="flex flex-wrap justify-end gap-4 text-sm text-muted">
              <a className="hover:text-accent" href="/news">Live Events / 实时事件</a>
              <a className="hover:text-accent" href={`${MAIN_SITE_URL}/data`}>Data Layer / 数据层</a>
              <a className="hover:text-accent" href={`${MAIN_SITE_URL}/markets`}>Markets / 市场</a>
              <a className="hover:text-accent" href={`${MAIN_SITE_URL}/chinese-car-brands`}>Companies / 公司</a>
              <a className="hover:text-accent" href="/news?lang=zh">中文</a>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
