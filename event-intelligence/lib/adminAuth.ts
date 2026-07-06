import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import type { AdminActor, AdminRole } from "./db";

const COOKIE_NAME = "tcc_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

const ROLE_RANK: Record<AdminRole, number> = {
  viewer: 1,
  editor: 2,
  admin: 3,
  system: 4
};

function adminEmail() {
  return process.env.ADMIN_EMAIL || (process.env.NODE_ENV === "production" ? "" : "admin@local.test");
}

function adminPassword() {
  return process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === "production" ? "" : "admin");
}

function adminRole(): AdminRole {
  const role = process.env.ADMIN_ROLE;
  if (role === "editor" || role === "viewer" || role === "system") return role;
  return "admin";
}

function sessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || (process.env.NODE_ENV === "production" ? "" : "dev-admin-session-secret");
}

function isConfigured() {
  return Boolean(adminEmail() && adminPassword() && sessionSecret());
}

function sign(payload: string) {
  return crypto.createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function encodeSession(actor: AdminActor) {
  const payload = Buffer.from(JSON.stringify({
    email: actor.email,
    role: actor.role,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS
  })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decodeSession(value: string | undefined): AdminActor | null {
  if (!value || !isConfigured()) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      email?: string;
      role?: AdminRole;
      exp?: number;
    };
    if (!data.email || !data.role || !data.exp || data.exp < Math.floor(Date.now() / 1000)) return null;
    if (data.role !== "admin" && data.role !== "editor" && data.role !== "viewer" && data.role !== "system") return null;
    return { email: data.email, role: data.role };
  } catch {
    return null;
  }
}

export function adminAuthStatus() {
  return {
    configured: isConfigured(),
    email: adminEmail() || null,
    role: adminRole()
  };
}

export function verifyAdminCredentials(email: string, password: string): AdminActor | null {
  if (!isConfigured()) return null;
  if (email !== adminEmail()) return null;
  if (!safeEqual(password, adminPassword())) return null;
  return { email, role: adminRole() };
}

export async function createAdminSession(actor: AdminActor) {
  const store = await cookies();
  store.set(COOKIE_NAME, encodeSession(actor), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_SECONDS,
    path: "/"
  });
}

export async function clearAdminSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getAdminActorFromCookies() {
  const store = await cookies();
  return decodeSession(store.get(COOKIE_NAME)?.value);
}

export function getAdminActorFromRequest(request: NextRequest) {
  return decodeSession(request.cookies.get(COOKIE_NAME)?.value);
}

export function hasRole(actor: AdminActor, minimumRole: Exclude<AdminRole, "system">) {
  return ROLE_RANK[actor.role] >= ROLE_RANK[minimumRole];
}

export async function requireAdminPage(minimumRole: Exclude<AdminRole, "system"> = "viewer") {
  const actor = await getAdminActorFromCookies();
  if (!actor) redirect("/admin/login" as never);
  if (!hasRole(actor, minimumRole)) redirect("/admin" as never);
  return actor;
}

export function requireAdminRequest(request: NextRequest, minimumRole: Exclude<AdminRole, "system"> = "viewer") {
  const actor = getAdminActorFromRequest(request);
  if (!actor) {
    return { ok: false as const, status: 401, error: "unauthorized" };
  }
  if (!hasRole(actor, minimumRole)) {
    return { ok: false as const, status: 403, error: "forbidden" };
  }
  return { ok: true as const, actor };
}
