import type { ReactNode } from "react";
import { hasRole } from "@/lib/adminAuth";
import type { AdminActor } from "@/lib/db";

const nav = [
  ["/admin", "Dashboard"],
  ["/admin/events", "Events"],
  ["/admin/signals", "Signals"],
  ["/admin/sources", "Sources"],
  ["/admin/audit", "Audit"]
];

export function AdminShell({
  actor,
  title,
  description,
  children
}: {
  actor: AdminActor;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-6 text-zinc-100">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-red-300">TopChinaCar Control Plane</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">{description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded border border-white/10 px-3 py-2 text-zinc-300">
              {actor.email} · {actor.role}
            </span>
            <form action="/api/admin/logout" method="post">
              <button className="rounded bg-white px-3 py-2 font-semibold text-zinc-950 hover:bg-red-100" type="submit">
                Sign out
              </button>
            </form>
          </div>
        </header>

        <nav className="mt-5 flex flex-wrap gap-2 border-b border-white/10 pb-5">
          {nav.map(([href, label]) => {
            const disabled = label === "Sources" && !hasRole(actor, "admin");
            return disabled ? (
              <span className="rounded border border-white/5 px-3 py-2 text-sm text-zinc-600" key={href}>
                {label}
              </span>
            ) : (
              <a className="rounded border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:border-red-300 hover:text-white" href={href} key={href}>
                {label}
              </a>
            );
          })}
        </nav>

        <div className="py-6">{children}</div>
      </div>
    </main>
  );
}

export function AdminPanel({ children }: { children: ReactNode }) {
  return (
    <section className="rounded border border-white/10 bg-white/[0.03] p-5">
      {children}
    </section>
  );
}

export function AdminBadge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "green" | "red" | "yellow" | "blue" }) {
  const className = {
    neutral: "border-white/10 bg-white/5 text-zinc-300",
    green: "border-green-400/30 bg-green-400/10 text-green-200",
    red: "border-red-400/30 bg-red-400/10 text-red-200",
    yellow: "border-yellow-400/30 bg-yellow-400/10 text-yellow-100",
    blue: "border-blue-400/30 bg-blue-400/10 text-blue-200"
  }[tone];

  return <span className={`inline-flex rounded border px-2 py-1 font-mono text-[11px] uppercase tracking-wide ${className}`}>{children}</span>;
}
