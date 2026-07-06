import { AdminBadge, AdminPanel, AdminShell } from "../_components/AdminShell";
import { hasRole, requireAdminPage } from "@/lib/adminAuth";
import { hasDatabaseConfig, listAdminSignals } from "@/lib/db";

export const dynamic = "force-dynamic";

const sourceTypes = ["all", "OEM", "POLICY", "MEDIA", "CHINA_MEDIA", "MACRO"];
const statuses = ["all", "new", "processed", "ignored", "flagged"];

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDate(value: string | null) {
  if (!value) return "No timestamp";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default async function AdminSignalsPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; source_type?: string; limit?: string }>;
}) {
  const actor = await requireAdminPage("viewer");
  const params = await searchParams;
  const status = statuses.includes(readParam(params.status) || "") ? readParam(params.status) || "all" : "all";
  const sourceType = sourceTypes.includes(readParam(params.source_type) || "") ? readParam(params.source_type) || "all" : "all";
  const limit = Math.min(100, Math.max(1, Number(readParam(params.limit) || 80)));
  const canMark = hasRole(actor, "editor");
  const signals = hasDatabaseConfig() ? await listAdminSignals({ status, sourceType, limit }) : [];

  return (
    <AdminShell
      actor={actor}
      title="Signal Monitor"
      description="Read-only raw signal stream. Admins can mark noise, but raw_text stays immutable."
    >
      <AdminPanel>
        <form className="grid gap-3 md:grid-cols-[180px_180px_120px_auto]" action="/admin/signals">
          <select className="rounded border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-zinc-100" name="status" defaultValue={status}>
            {statuses.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select className="rounded border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-zinc-100" name="source_type" defaultValue={sourceType}>
            {sourceTypes.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <input className="rounded border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-zinc-100" name="limit" type="number" min="1" max="100" defaultValue={limit} />
          <button className="rounded bg-white px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-red-100" type="submit">
            Apply filter
          </button>
        </form>
      </AdminPanel>

      <div className="mt-5 grid gap-4">
        {!hasDatabaseConfig() ? (
          <AdminPanel>
            <AdminBadge tone="yellow">Database not configured</AdminBadge>
            <p className="mt-3 text-sm text-zinc-400">Set DATABASE_URL or SUPABASE_DATABASE_URL to load signals.</p>
          </AdminPanel>
        ) : null}

        {signals.length === 0 && hasDatabaseConfig() ? (
          <AdminPanel>
            <AdminBadge tone="green">No signals</AdminBadge>
            <p className="mt-3 text-sm text-zinc-400">No raw signals matched the current filter.</p>
          </AdminPanel>
        ) : null}

        {signals.map((signal) => (
          <article className="rounded border border-white/10 bg-zinc-900 p-5" key={signal.id}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <AdminBadge tone={signal.is_noise ? "red" : "green"}>{signal.is_noise ? "noise" : "signal"}</AdminBadge>
                  <AdminBadge>{signal.source_type}</AdminBadge>
                  <AdminBadge tone="blue">{signal.signal_type}</AdminBadge>
                  <AdminBadge tone={signal.admin_status === "ignored" ? "red" : "neutral"}>{signal.admin_status}</AdminBadge>
                </div>
                <h2 className="mt-3 text-lg font-semibold text-white">{signal.raw_title || signal.source_name}</h2>
                <p className="mt-2 text-sm text-zinc-500">{formatDate(signal.timestamp || signal.created_at)}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="rounded border border-white/10 bg-zinc-950 p-3">
                  <div className="font-mono text-zinc-500">Strength</div>
                  <div className="mt-1 text-base font-semibold text-white">{signal.signal_strength.toFixed(2)}</div>
                </div>
                <div className="rounded border border-white/10 bg-zinc-950 p-3">
                  <div className="font-mono text-zinc-500">Processed</div>
                  <div className="mt-1 text-base font-semibold text-white">{signal.processed ? "Yes" : "No"}</div>
                </div>
              </div>
            </div>

            <dl className="mt-5 grid gap-3 text-sm md:grid-cols-3">
              <div>
                <dt className="text-zinc-500">Source</dt>
                <dd className="mt-1 text-zinc-200">{signal.source_name}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Entity guess</dt>
                <dd className="mt-1 text-zinc-200">{signal.entity_guess || "Unmapped"}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Market guess</dt>
                <dd className="mt-1 text-zinc-200">{signal.market_guess || "Unmapped"}</dd>
              </div>
            </dl>

            <div className="mt-5 rounded border border-white/10 bg-zinc-950 p-4">
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-zinc-500">Raw text</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-300">{signal.raw_text}</p>
              <a className="mt-3 inline-flex text-sm text-red-200 hover:text-white" href={signal.source_url} rel="noreferrer" target="_blank">
                Open source
              </a>
            </div>

            {signal.noise_reason ? (
              <p className="mt-3 text-sm text-red-200">Noise reason: {signal.noise_reason}</p>
            ) : null}

            {canMark ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {!signal.is_noise ? (
                  <form className="flex flex-wrap gap-2" action="/api/admin/signals" method="post">
                    <input type="hidden" name="signal_id" value={signal.id} />
                    <input type="hidden" name="action" value="mark_noise" />
                    <input className="min-w-64 rounded border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-zinc-100" name="noise_reason" placeholder="Noise reason" />
                    <button className="rounded bg-red-200 px-3 py-2 text-sm font-semibold text-red-950 hover:bg-red-100" type="submit">
                      Mark noise
                    </button>
                  </form>
                ) : (
                  <form action="/api/admin/signals" method="post">
                    <input type="hidden" name="signal_id" value={signal.id} />
                    <input type="hidden" name="action" value="clear_noise" />
                    <button className="rounded bg-white px-3 py-2 text-sm font-semibold text-zinc-950 hover:bg-red-100" type="submit">
                      Clear noise
                    </button>
                  </form>
                )}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </AdminShell>
  );
}
