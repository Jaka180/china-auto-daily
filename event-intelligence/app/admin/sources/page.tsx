import { AdminBadge, AdminPanel, AdminShell } from "../_components/AdminShell";
import { requireAdminPage } from "@/lib/adminAuth";
import { hasDatabaseConfig, listAdminSources } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminSourcesPage() {
  const actor = await requireAdminPage("admin");
  const sources = hasDatabaseConfig() ? await listAdminSources() : [];

  return (
    <AdminShell
      actor={actor}
      title="Source Management"
      description="Control which configured sources are active in ingestion and tune source priority without changing code."
    >
      {!hasDatabaseConfig() ? (
        <AdminPanel>
          <AdminBadge tone="yellow">Database not configured</AdminBadge>
          <p className="mt-3 text-sm text-zinc-400">Set DATABASE_URL or SUPABASE_DATABASE_URL to manage sources.</p>
        </AdminPanel>
      ) : (
        <div className="overflow-hidden rounded border border-white/10 bg-zinc-900">
          <div className="grid grid-cols-12 gap-3 border-b border-white/10 px-4 py-3 font-mono text-xs uppercase tracking-[0.16em] text-zinc-500">
            <div className="col-span-4">Source</div>
            <div className="col-span-2">Layer</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-4">Controls</div>
          </div>
          {sources.map((source) => (
            <form className="grid grid-cols-12 gap-3 border-b border-white/10 px-4 py-4 last:border-b-0" action="/api/admin/sources" method="post" key={source.id}>
              <input type="hidden" name="source_id" value={source.id} />
              <div className="col-span-12 min-w-0 md:col-span-4">
                <div className="font-semibold text-white">{source.name}</div>
                <div className="mt-1 truncate text-xs text-zinc-500">{source.url || "No URL"}</div>
              </div>
              <div className="col-span-6 md:col-span-2">
                <AdminBadge>{source.source_type}</AdminBadge>
                <p className="mt-2 text-xs text-zinc-500">{source.category || source.type}</p>
              </div>
              <div className="col-span-6 md:col-span-2">
                <AdminBadge tone={source.status === "active" ? "green" : "red"}>{source.status}</AdminBadge>
                <p className="mt-2 text-xs text-zinc-500">Priority {source.priority}</p>
              </div>
              <div className="col-span-12 grid gap-2 md:col-span-4 md:grid-cols-[1fr_96px_120px_auto]">
                <select className="rounded border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-zinc-100" name="status" defaultValue={source.status}>
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                </select>
                <input className="rounded border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-zinc-100" name="priority" type="number" min="1" max="10" defaultValue={source.priority} />
                <input className="rounded border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-zinc-100" name="reliability_score" type="number" min="0" max="1" step="0.01" defaultValue={source.reliability_score} />
                <button className="rounded bg-white px-3 py-2 text-sm font-semibold text-zinc-950 hover:bg-red-100" type="submit">
                  Save
                </button>
              </div>
            </form>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
