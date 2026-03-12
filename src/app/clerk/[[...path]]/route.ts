import { NextRequest } from "next/server";

const CLERK_FRONTEND_API = "https://frontend-api.clerk.services";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  return proxy(request, await params);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  return proxy(request, await params);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  return proxy(request, await params);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  return proxy(request, await params);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  return proxy(request, await params);
}

async function proxy(
  request: NextRequest,
  params: { path?: string[] }
) {
  const path = params.path?.join("/") || "";
  const url = new URL(`/${path}`, CLERK_FRONTEND_API);

  // Forward query params
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  // Build clean headers — don't forward hop-by-hop headers from the original request
  const headers: Record<string, string> = {
    host: "clerk.tryroam.xyz",
    "x-forwarded-host": request.headers.get("host") || "tryroam.xyz",
    "x-forwarded-proto": "https",
  };

  // Selectively forward safe headers
  const forwardKeys = [
    "content-type",
    "authorization",
    "cookie",
    "user-agent",
    "accept",
    "accept-language",
    "referer",
    "origin",
    "clerk-cookie",
    "x-clerk-publishable-key",
  ];
  for (const key of forwardKeys) {
    const value = request.headers.get(key);
    if (value) headers[key] = value;
  }

  try {
    const body =
      request.method !== "GET" && request.method !== "HEAD"
        ? await request.text()
        : undefined;

    const response = await fetch(url.toString(), {
      method: request.method,
      headers,
      body,
    });

    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete("content-encoding");
    responseHeaders.delete("transfer-encoding");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("[clerk-proxy] Fetch failed:", detail);
    return new Response(
      JSON.stringify({ error: "Proxy request failed", detail }),
      { status: 502, headers: { "content-type": "application/json" } }
    );
  }
}
