import { AdminBadge, AdminPanel, AdminShell } from "./_components/AdminShell";
import { requireAdminPage } from "@/lib/adminAuth";
import { getAdminDashboardStats, hasDatabaseConfig } from "@/lib/db";

export const dynamic = "force-dynamic";

function StatCard({ label, value, hint }: { label: string; value: number | string; hint: string }) {
  return (
    <div className="rounded border border-white/10 bg-zinc-900 p-5">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <div className="mt-3 text-3xl font-semibold text-white">{value}</div>
      <p className="mt-2 text-sm text-zinc-400">{hint}</p>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const actor = await requireAdminPage();
  const stats = hasDatabaseConfig() ? await getAdminDashboardStats() : null;

  return (
    <AdminShell
      actor={actor}
      title="Control Plane Dashboard"
      description="Minimum operational view for review queue, raw signal volume, source status and system auditability."
    >
      {!stats ? (
        <AdminPanel>
          <AdminBadge tone="yellow">Database not configured</AdminBadge>
          <p className="mt-3 text-sm text-zinc-400">Set DATABASE_URL or SUPABASE_DATABASE_URL before using the admin control plane.</p>
        </AdminPanel>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Pending events" value={stats.events.pending} hint="Events waiting for human review" />
          <StatCard label="Published events" value={stats.events.published} hint="Visible to public /news and event pages" />
          <StatCard label="Signals" value={stats.signals.total} hint={`${stats.signals.noise} marked as noise`} />
          <StatCard label="Active sources" value={`${stats.sources.active}/${stats.sources.total}`} hint="Sources allowed into ingestion" />
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <AdminPanel>
          <h2 className="text-lg font-semibold">Review workflow</h2>
          <div className="mt-4 grid gap-3 text-sm text-zinc-300">
            <div className="flex items-center gap-3"><AdminBadge tone="yellow">pending</AdminBadge><span>AI-generated events wait here.</span></div>
            <div className="flex items-center gap-3"><AdminBadge tone="green">published</AdminBadge><span>Only this state is visible in public surfaces.</span></div>
            <div className="flex items-center gap-3"><AdminBadge tone="red">rejected</AdminBadge><span>Rejected events are hidden from public pages.</span></div>
            <div className="flex items-center gap-3"><AdminBadge tone="blue">needs_fix</AdminBadge><span>Events that need correction stay out of public output.</span></div>
          </div>
        </AdminPanel>
        <AdminPanel>
          <h2 className="text-lg font-semibold">Public data rule</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Public pages and APIs read only <code className="rounded bg-zinc-900 px-1 py-0.5 text-zinc-200">review_status = published</code>. Pending, rejected and needs_fix events remain admin-only.
          </p>
        </AdminPanel>
      </div>
    </AdminShell>
  );
}
