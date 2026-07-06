import { AdminBadge, AdminPanel, AdminShell } from "../_components/AdminShell";
import { hasRole, requireAdminPage } from "@/lib/adminAuth";
import { hasDatabaseConfig, listAdminEvents } from "@/lib/db";
import { EVENT_TYPES, REVIEW_STATUSES, type ReviewStatus } from "@/lib/events/types";

export const dynamic = "force-dynamic";

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isReviewStatus(value: string | undefined): value is ReviewStatus {
  return Boolean(value && REVIEW_STATUSES.includes(value as ReviewStatus));
}

function statusTone(status: string): "neutral" | "green" | "red" | "yellow" | "blue" {
  if (status === "published") return "green";
  if (status === "rejected") return "red";
  if (status === "needs_fix") return "blue";
  if (status === "pending") return "yellow";
  return "neutral";
}

function formatDate(value: string | null) {
  if (!value) return "Unknown date";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

export default async function AdminEventsPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; limit?: string }>;
}) {
  const actor = await requireAdminPage("viewer");
  const params = await searchParams;
  const rawStatus = readParam(params.status) || "pending";
  const status = rawStatus === "all" || isReviewStatus(rawStatus) ? rawStatus : "pending";
  const limit = Math.min(100, Math.max(1, Number(readParam(params.limit) || 50)));
  const canEdit = hasRole(actor, "editor");
  const events = hasDatabaseConfig() ? await listAdminEvents({ status, limit }) : [];

  return (
    <AdminShell
      actor={actor}
      title="Event Review"
      description="Review AI-generated events before they become public intelligence records. Only published events are visible on public pages."
    >
      <AdminPanel>
        <form className="grid gap-3 md:grid-cols-[220px_120px_auto]" action="/admin/events">
          <select className="rounded border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-zinc-100" name="status" defaultValue={status}>
            <option value="pending">pending</option>
            <option value="published">published</option>
            <option value="rejected">rejected</option>
            <option value="needs_fix">needs_fix</option>
            <option value="all">all</option>
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
            <p className="mt-3 text-sm text-zinc-400">Set DATABASE_URL or SUPABASE_DATABASE_URL to load the review queue.</p>
          </AdminPanel>
        ) : null}

        {events.length === 0 && hasDatabaseConfig() ? (
          <AdminPanel>
            <AdminBadge tone="green">Queue empty</AdminBadge>
            <p className="mt-3 text-sm text-zinc-400">No events matched the current filter.</p>
          </AdminPanel>
        ) : null}

        {events.map((event) => (
          <article className="rounded border border-white/10 bg-zinc-900 p-5" key={event.id}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <AdminBadge tone={statusTone(event.review_status)}>{event.review_status}</AdminBadge>
                  <AdminBadge>{event.event_type}</AdminBadge>
                  {event.is_seed ? <AdminBadge tone="blue">seed</AdminBadge> : <AdminBadge tone="green">live</AdminBadge>}
                </div>
                <h2 className="mt-3 text-xl font-semibold tracking-tight text-white">{event.title}</h2>
                <p className="mt-2 max-w-4xl text-sm leading-6 text-zinc-400">{event.summary}</p>
              </div>
              <div className="grid min-w-64 grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded border border-white/10 bg-zinc-950 p-3">
                  <div className="font-mono text-zinc-500">Impact</div>
                  <div className="mt-1 text-base font-semibold text-white">{event.impact_score.toFixed(1)}</div>
                </div>
                <div className="rounded border border-white/10 bg-zinc-950 p-3">
                  <div className="font-mono text-zinc-500">Confidence</div>
                  <div className="mt-1 text-base font-semibold text-white">{event.confidence_score.toFixed(2)}</div>
                </div>
                <div className="rounded border border-white/10 bg-zinc-950 p-3">
                  <div className="font-mono text-zinc-500">Final</div>
                  <div className="mt-1 text-base font-semibold text-white">{event.final_score.toFixed(1)}</div>
                </div>
              </div>
            </div>

            <dl className="mt-5 grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
              <div>
                <dt className="text-zinc-500">Company</dt>
                <dd className="mt-1 text-zinc-200">{event.company || "Unmapped"}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Market</dt>
                <dd className="mt-1 text-zinc-200">{event.market || "Unmapped"}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Date</dt>
                <dd className="mt-1 text-zinc-200">{formatDate(event.event_date)}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Source</dt>
                <dd className="mt-1 truncate text-zinc-200">{event.source_name || event.source_url}</dd>
              </div>
            </dl>

            <div className="mt-5 rounded border border-white/10 bg-zinc-950 p-4">
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-zinc-500">Evidence</p>
              <p className="mt-2 text-sm leading-6 text-zinc-300">{event.raw_evidence}</p>
              <a className="mt-3 inline-flex text-sm text-red-200 hover:text-white" href={event.source_url} rel="noreferrer" target="_blank">
                Open source
              </a>
            </div>

            {canEdit ? (
              <div className="mt-5 flex flex-wrap gap-2">
                <form action="/api/admin/events" method="post">
                  <input type="hidden" name="event_id" value={event.id} />
                  <input type="hidden" name="action" value="approve" />
                  <button className="rounded bg-green-200 px-3 py-2 text-sm font-semibold text-green-950 hover:bg-green-100" type="submit">
                    Publish
                  </button>
                </form>
                <form action="/api/admin/events" method="post">
                  <input type="hidden" name="event_id" value={event.id} />
                  <input type="hidden" name="action" value="needs_fix" />
                  <button className="rounded bg-blue-200 px-3 py-2 text-sm font-semibold text-blue-950 hover:bg-blue-100" type="submit">
                    Needs fix
                  </button>
                </form>
                <form action="/api/admin/events" method="post">
                  <input type="hidden" name="event_id" value={event.id} />
                  <input type="hidden" name="action" value="reject" />
                  <button className="rounded bg-red-200 px-3 py-2 text-sm font-semibold text-red-950 hover:bg-red-100" type="submit">
                    Reject
                  </button>
                </form>
              </div>
            ) : null}

            {canEdit ? (
              <details className="mt-5 rounded border border-white/10 bg-zinc-950 p-4">
                <summary className="cursor-pointer text-sm font-semibold text-zinc-200">Edit event fields</summary>
                <form className="mt-4 grid gap-3" action="/api/admin/events" method="post">
                  <input type="hidden" name="event_id" value={event.id} />
                  <input type="hidden" name="action" value="edit" />
                  <label className="grid gap-1 text-sm text-zinc-400">
                    Title
                    <input className="rounded border border-white/10 bg-zinc-900 px-3 py-2 text-zinc-100" name="title" defaultValue={event.title} required />
                  </label>
                  <label className="grid gap-1 text-sm text-zinc-400">
                    Summary
                    <textarea className="min-h-24 rounded border border-white/10 bg-zinc-900 px-3 py-2 text-zinc-100" name="summary" defaultValue={event.summary} required />
                  </label>
                  <div className="grid gap-3 md:grid-cols-3">
                    <label className="grid gap-1 text-sm text-zinc-400">
                      Event type
                      <select className="rounded border border-white/10 bg-zinc-900 px-3 py-2 text-zinc-100" name="event_type" defaultValue={event.event_type}>
                        {EVENT_TYPES.map((eventType) => (
                          <option key={eventType} value={eventType}>{eventType}</option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-1 text-sm text-zinc-400">
                      Company
                      <input className="rounded border border-white/10 bg-zinc-900 px-3 py-2 text-zinc-100" name="company" defaultValue={event.company || ""} />
                    </label>
                    <label className="grid gap-1 text-sm text-zinc-400">
                      Market
                      <input className="rounded border border-white/10 bg-zinc-900 px-3 py-2 text-zinc-100" name="market" defaultValue={event.market || ""} />
                    </label>
                    <label className="grid gap-1 text-sm text-zinc-400">
                      Model
                      <input className="rounded border border-white/10 bg-zinc-900 px-3 py-2 text-zinc-100" name="model" defaultValue={event.model || ""} />
                    </label>
                    <label className="grid gap-1 text-sm text-zinc-400">
                      Event date
                      <input className="rounded border border-white/10 bg-zinc-900 px-3 py-2 text-zinc-100" name="event_date" defaultValue={event.event_date || ""} />
                    </label>
                    <label className="grid gap-1 text-sm text-zinc-400">
                      Impact score
                      <input className="rounded border border-white/10 bg-zinc-900 px-3 py-2 text-zinc-100" name="impact_score" type="number" min="0" max="10" step="0.1" defaultValue={event.impact_score} />
                    </label>
                    <label className="grid gap-1 text-sm text-zinc-400">
                      Confidence score
                      <input className="rounded border border-white/10 bg-zinc-900 px-3 py-2 text-zinc-100" name="confidence_score" type="number" min="0" max="1" step="0.01" defaultValue={event.confidence_score} />
                    </label>
                  </div>
                  <button className="w-fit rounded bg-white px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-red-100" type="submit">
                    Save changes
                  </button>
                </form>
              </details>
            ) : null}
          </article>
        ))}
      </div>
    </AdminShell>
  );
}
