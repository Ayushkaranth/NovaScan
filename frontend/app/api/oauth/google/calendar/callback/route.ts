import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

/**
 * Google redirects to the Vercel origin. Keep OAuth client secrets and code
 * exchange on the backend by relaying the callback server-to-server.
 */
export async function GET(request: NextRequest) {
  const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!configuredApiUrl) {
    return NextResponse.json({ detail: "Backend API URL is not configured" }, { status: 503 });
  }

  let backendCallback: URL;
  try {
    const apiUrl = new URL(configuredApiUrl);
    const apiPath = apiUrl.pathname.replace(/\/+$/, "");
    const versionedPath = apiPath.endsWith("/api/v1") ? apiPath : `${apiPath}/api/v1`;
    apiUrl.pathname = `${versionedPath}/standup/google/callback`;
    apiUrl.search = request.nextUrl.search;
    backendCallback = apiUrl;
  } catch {
    return NextResponse.json({ detail: "Backend API URL is invalid" }, { status: 503 });
  }

  try {
    const backendResponse = await fetch(backendCallback, {
      method: "GET",
      cache: "no-store",
      redirect: "manual",
    });
    const location = backendResponse.headers.get("location");

    if (location && REDIRECT_STATUSES.has(backendResponse.status)) {
      return NextResponse.redirect(location, backendResponse.status);
    }

    return new NextResponse(await backendResponse.text(), {
      status: backendResponse.status,
      headers: { "content-type": backendResponse.headers.get("content-type") || "text/plain; charset=utf-8" },
    });
  } catch {
    return NextResponse.json({ detail: "Could not relay Google Calendar authorization to the backend" }, { status: 502 });
  }
}
