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

  const headers = new Headers(request.headers);
  headers.set("host", "clerk.tryroam.xyz");
  headers.set("x-forwarded-host", request.headers.get("host") || "tryroam.xyz");
  headers.set("x-forwarded-proto", "https");

  try {
    const response = await fetch(url.toString(), {
      method: request.method,
      headers,
      body: request.method !== "GET" && request.method !== "HEAD" ? await request.text() : undefined,
    });

    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete("content-encoding");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("[clerk-proxy] Fetch failed:", error);
    return new Response(JSON.stringify({ error: "Proxy request failed" }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }
}
