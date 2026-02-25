/**
 * Returns a proxied URL for images that can't be loaded directly in the browser
 * (e.g. TikTok CDN images blocked by referrer policy).
 */
export function getProxiedImageUrl(
  imageUrl: string | null | undefined,
  sourceUrl?: string | null
): string {
  if (!imageUrl) return "";

  if (needsProxy(imageUrl)) {
    const params = new URLSearchParams({ url: imageUrl });
    if (sourceUrl) params.set("source_url", sourceUrl);
    return `/api/image-proxy?${params.toString()}`;
  }

  return imageUrl;
}

function needsProxy(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    return hostname.includes("tiktokcdn");
  } catch {
    return false;
  }
}
