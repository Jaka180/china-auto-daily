import type { NextRequest } from "next/server";

export function authorizeCronRequest(request: NextRequest) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return {
      ok: process.env.NODE_ENV !== "production",
      status: process.env.NODE_ENV === "production" ? 503 : 200,
      error: "CRON_SECRET is required in production"
    };
  }

  const auth = request.headers.get("authorization");
  return {
    ok: auth === `Bearer ${secret}`,
    status: 401,
    error: "unauthorized"
  };
}
