import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const isChinese =
    request.nextUrl.pathname.startsWith("/zh/") ||
    request.nextUrl.searchParams.get("lang") === "zh";

  requestHeaders.set("x-tcc-locale", isChinese ? "zh" : "en");

  return NextResponse.next({
    request: {
      headers: requestHeaders
    }
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
