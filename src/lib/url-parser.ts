import ogs from "open-graph-scraper";
import type { InspoType, UrlPreview } from "@/types/inspo";

export async function parseUrl(url: string): Promise<UrlPreview> {
  // Resolve short URLs (e.g. tiktok.com/t/...) to their final destination
  const resolvedUrl = await resolveRedirects(url);

  // For TikTok, use oEmbed as the primary source since OGS gets generic data
  if (resolvedUrl.includes("tiktok.com")) {
    return parseTikTok(resolvedUrl);
  }

  const { result } = await ogs({ url: resolvedUrl });

  const ogImage =
    result.ogImage && result.ogImage.length > 0
      ? result.ogImage[0].url
      : null;

  const type = detectType(resolvedUrl, result.ogType);

  return {
    url: resolvedUrl,
    title: result.ogTitle || null,
    description: result.ogDescription || null,
    image_url: ogImage,
    site_name: result.ogSiteName || null,
    favicon_url: result.favicon || null,
    type,
  };
}

async function resolveRedirects(url: string): Promise<string> {
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow" });
    return res.url || url;
  } catch {
    return url;
  }
}

async function fetchTikTokOEmbed(
  url: string
): Promise<{ title: string; thumbnail_url: string; author_name: string } | null> {
  try {
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
    const res = await fetch(oembedUrl);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function cleanTikTokTitle(raw: string): string {
  // Strip hashtags and excessive whitespace, keep the actual caption
  return raw
    .replace(/#\S+/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

const TIKTOK_FAVICON =
  "https://www.tiktok.com/favicon.ico";

async function parseTikTok(url: string): Promise<UrlPreview> {
  // Try oEmbed with the URL as-is first
  let oembed = await fetchTikTokOEmbed(url);

  // For photo slideshows (/photo/), oEmbed may fail — try swapping to /video/
  if (!oembed && url.includes("/photo/")) {
    const videoUrl = url.replace("/photo/", "/video/");
    oembed = await fetchTikTokOEmbed(videoUrl);
  }

  // Determine if this is a photo slideshow
  const isPhoto = url.includes("/photo/");

  if (oembed) {
    const cleanTitle = cleanTikTokTitle(oembed.title || "");
    return {
      url,
      title: cleanTitle || `TikTok by ${oembed.author_name}` || null,
      description: oembed.title || null,
      image_url: oembed.thumbnail_url || null,
      site_name: "TikTok",
      favicon_url: TIKTOK_FAVICON,
      type: isPhoto ? "image" : "video",
    };
  }

  // Fallback to OGS if oEmbed completely failed
  try {
    const { result } = await ogs({ url });
    const ogImage =
      result.ogImage && result.ogImage.length > 0
        ? result.ogImage[0].url
        : null;

    // Filter out TikTok's generic placeholder title
    const isGenericTitle =
      !result.ogTitle ||
      result.ogTitle === "Make Your Day" ||
      result.ogTitle.startsWith("Visit TikTok");

    return {
      url,
      title: isGenericTitle ? null : result.ogTitle || null,
      description: result.ogDescription || null,
      image_url: ogImage,
      site_name: "TikTok",
      favicon_url: result.favicon || TIKTOK_FAVICON,
      type: isPhoto ? "image" : "video",
    };
  } catch {
    return {
      url,
      title: null,
      description: null,
      image_url: null,
      site_name: "TikTok",
      favicon_url: TIKTOK_FAVICON,
      type: isPhoto ? "image" : "video",
    };
  }
}

function detectType(url: string, ogType?: string): InspoType {
  const lowerUrl = url.toLowerCase();

  // Video platforms
  if (
    lowerUrl.includes("tiktok.com") ||
    lowerUrl.includes("youtube.com") ||
    lowerUrl.includes("youtu.be") ||
    lowerUrl.includes("vimeo.com") ||
    lowerUrl.includes("instagram.com/reel")
  ) {
    return "video";
  }

  // Image hosting
  if (
    lowerUrl.includes("unsplash.com") ||
    lowerUrl.includes("pinterest.com") ||
    lowerUrl.includes("flickr.com") ||
    /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(lowerUrl)
  ) {
    return "image";
  }

  // Article sites
  if (
    ogType === "article" ||
    lowerUrl.includes("medium.com") ||
    lowerUrl.includes("blog") ||
    lowerUrl.includes("tripadvisor.com") ||
    lowerUrl.includes("lonelyplanet.com")
  ) {
    return "article";
  }

  if (ogType?.startsWith("video")) {
    return "video";
  }

  return "link";
}
