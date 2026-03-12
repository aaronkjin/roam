import { NextRequest, NextResponse } from "next/server";

function isAllowedUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    // Block non-http(s) protocols
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    // Block private/internal IPs
    const host = parsed.hostname;
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "0.0.0.0" ||
      host.startsWith("10.") ||
      host.startsWith("192.168.") ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
      host === "[::1]" ||
      host.endsWith(".internal") ||
      host.endsWith(".local")
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  if (!isAllowedUrl(url)) {
    return NextResponse.json({ error: "URL not allowed" }, { status: 403 });
  }

  try {
    // Fetch image server-side (bypasses browser referrer/CORS restrictions)
    let response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Roam/1.0)" },
    });

    // If TikTok CDN returns an error (e.g. expired signed URL), re-fetch via oEmbed
    if (!response.ok && url.includes("tiktokcdn")) {
      const sourceUrl = req.nextUrl.searchParams.get("source_url");
      if (sourceUrl) {
        const freshUrl = await refreshTikTokThumbnail(sourceUrl);
        if (freshUrl) {
          response = await fetch(freshUrl, {
            headers: { "User-Agent": "Mozilla/5.0 (compatible; Roam/1.0)" },
          });
        }
      }
    }

    if (!response.ok) {
      return NextResponse.json({ error: "Image fetch failed" }, { status: 502 });
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/jpeg";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Proxy error" }, { status: 500 });
  }
}

async function refreshTikTokThumbnail(
  sourceUrl: string
): Promise<string | null> {
  try {
    // Try the URL as-is
    let oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(sourceUrl)}`;
    let res = await fetch(oembedUrl);

    // For photo slideshows, oEmbed may need /video/ instead of /photo/
    if (!res.ok && sourceUrl.includes("/photo/")) {
      const videoUrl = sourceUrl.replace("/photo/", "/video/");
      oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(videoUrl)}`;
      res = await fetch(oembedUrl);
    }

    if (!res.ok) return null;
    const data = await res.json();
    return data.thumbnail_url || null;
  } catch {
    return null;
  }
}
