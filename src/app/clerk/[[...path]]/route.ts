import { NextRequest } from "next/server";

// Try the CNAME domain first (server-side TLS may work even if browser fails),
// then fall back to the shared multi-tenant host
const CLERK_TARGETS = [
  "https://clerk.tryroam.xyz",
  "https://frontend-api.clerk.services",
];

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

function getErrorDetail(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  let msg = error.message;
  // undici wraps the real error in .cause
  if (error.cause instanceof Error) {
    msg += ` | cause: ${error.cause.message}`;
    if ((error.cause as NodeJS.ErrnoException).code) {
      msg += ` (${(error.cause as NodeJS.ErrnoException).code})`;
    }
  }
  return msg;
}

async function proxy(
  request: NextRequest,
  params: { path?: string[] }
) {
  const path = params.path?.join("/") || "";

  // Forward query params
  const qs = new URLSearchParams();
  request.nextUrl.searchParams.forEach((value, key) => {
    qs.set(key, value);
  });
  const queryString = qs.toString() ? `?${qs.toString()}` : "";

  const body =
    request.method !== "GET" && request.method !== "HEAD"
      ? await request.text()
      : undefined;

  const errors: string[] = [];

  for (const target of CLERK_TARGETS) {
    const url = `${target}/${path}${queryString}`;

    // Build clean headers for each attempt
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
      const response = await fetch(url, {
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
      const detail = getErrorDetail(error);
      errors.push(`${target}: ${detail}`);
      console.error(`[clerk-proxy] ${target} failed:`, detail);
      // Try next target
    }
  }

  return new Response(
    JSON.stringify({
      error: "All proxy targets failed",
      attempts: errors,
    }),
    { status: 502, headers: { "content-type": "application/json" } }
  );
}
