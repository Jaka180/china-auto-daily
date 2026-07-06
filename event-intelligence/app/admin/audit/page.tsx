import { AdminBadge, AdminPanel, AdminShell } from "../_components/AdminShell";
import { requireAdminPage } from "@/lib/adminAuth";
import { hasDatabaseConfig, listAuditLogs } from "@/lib/db";

export const dynamic = "force-dynamic";

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function compactJson(value: unknown) {
  if (!value) return "null";
  const text = JSON.stringify(value);
  return text.length > 260 ? `${text.slice(0, 260)}...` : text;
}

export default async function AdminAuditPage({
  searchParams
}: {
  searchParams: Promise<{ actor?: string; action?: string; target_type?: string; limit?: string }>;
}) {
  const actor = await requireAdminPage("viewer");
  const params = await searchParams;
  const actorFilter = readParam(params.actor) || "";
  const actionFilter = readParam(params.action) || "";
  const targetTypeFilter = readParam(params.target_type) || "";
  const limit = Math.min(200, Math.max(1, Number(readParam(params.limit) || 100)));
  const logs = hasDatabaseConfig()
    ? await listAuditLogs({
      actor: actorFilter || undefined,
      action: actionFilter || undefined,
      targetType: targetTypeFilter || undefined,
      limit
    })
    : [];

  return (
    <AdminShell
      actor={actor}
      title="Audit Log"
      description="Immutable operational history for event review, signal marking and source control actions."
    >
      <AdminPanel>
        <form className="grid gap-3 md:grid-cols-[1fr_1fr_160px_120px_auto]" action="/admin/audit">
          <input className="rounded border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-zinc-100" name="actor" placeholder="Actor email" defaultValue={actorFilter} />
          <input className="rounded border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-zinc-100" name="action" placeholder="Action" defaultValue={actionFilter} />
          <select className="rounded border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-zinc-100" name="target_type" defaultValue={targetTypeFilter}>
            <option value="">all targets</option>
            <option value="event">event</option>
            <option value="signal">signal</option>
            <option value="source">source</option>
          </select>
          <input className="rounded border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-zinc-100" name="limit" type="number" min="1" max="200" defaultValue={limit} />
          <button className="rounded bg-white px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-red-100" type="submit">
            Apply filter
          </button>
        </form>
      </AdminPanel>

      <div className="mt-5 grid gap-3">
        {!hasDatabaseConfig() ? (
          <AdminPanel>
            <AdminBadge tone="yellow">Database not configured</AdminBadge>
            <p className="mt-3 text-sm text-zinc-400">Set DATABASE_URL or SUPABASE_DATABASE_URL to load audit logs.</p>
          </AdminPanel>
        ) : null}

        {logs.length === 0 && hasDatabaseConfig() ? (
          <AdminPanel>
            <AdminBadge tone="green">No audit records</AdminBadge>
            <p className="mt-3 text-sm text-zinc-400">No audit records matched the current filter.</p>
          </AdminPanel>
        ) : null}

        {logs.map((log) => (
          <article className="rounded border border-white/10 bg-zinc-900 p-4" key={log.id}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <AdminBadge tone="blue">{log.action}</AdminBadge>
                  <AdminBadge>{log.target_type}</AdminBadge>
                  {log.actor_role ? <AdminBadge tone="neutral">{log.actor_role}</AdminBadge> : null}
                </div>
                <p className="mt-3 text-sm text-zinc-300">{log.actor_email || "system"} changed {log.target_id || "unknown target"}</p>
              </div>
              <time className="text-sm text-zinc-500">{formatDate(log.created_at)}</time>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <div className="rounded border border-white/10 bg-zinc-950 p-3">
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-zinc-500">Before</p>
                <pre className="mt-2 overflow-x-auto text-xs leading-5 text-zinc-400">{compactJson(log.before_json)}</pre>
              </div>
              <div className="rounded border border-white/10 bg-zinc-950 p-3">
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-zinc-500">After</p>
                <pre className="mt-2 overflow-x-auto text-xs leading-5 text-zinc-400">{compactJson(log.after_json)}</pre>
              </div>
            </div>
          </article>
        ))}
      </div>
    </AdminShell>
  );
}
