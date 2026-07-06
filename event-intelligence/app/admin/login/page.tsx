import { adminAuthStatus } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const auth = adminAuthStatus();

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-12 text-zinc-100">
      <section className="mx-auto max-w-md rounded border border-white/10 bg-white/[0.03] p-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-red-300">Admin Control Plane</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Review events, monitor signals, manage sources and inspect audit logs.
        </p>

        {!auth.configured ? (
          <div className="mt-6 rounded border border-yellow-400/30 bg-yellow-400/10 p-4 text-sm leading-6 text-yellow-100">
            Admin auth is not configured. Set <code>ADMIN_EMAIL</code>, <code>ADMIN_PASSWORD</code> and <code>ADMIN_SESSION_SECRET</code> in the server environment.
          </div>
        ) : null}

        {params.error ? (
          <div className="mt-6 rounded border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-100">
            Invalid admin credentials.
          </div>
        ) : null}

        <form className="mt-6 grid gap-4" action="/api/admin/login" method="post">
          <label className="grid gap-2 text-sm">
            <span className="text-zinc-300">Email</span>
            <input className="rounded border border-white/10 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none focus:border-red-300" name="email" type="email" defaultValue={auth.email || ""} required />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="text-zinc-300">Password</span>
            <input className="rounded border border-white/10 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none focus:border-red-300" name="password" type="password" required />
          </label>
          <button className="rounded bg-white px-4 py-2 font-semibold text-zinc-950 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50" disabled={!auth.configured} type="submit">
            Sign in
          </button>
        </form>
      </section>
    </main>
  );
}
