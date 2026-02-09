import ogs from "open-graph-scraper";
import type { InspoType, UrlPreview } from "@/types/inspo";

export async function parseUrl(url: string): Promise<UrlPreview> {
  const { result } = await ogs({ url });

  const ogImage =
    result.ogImage && result.ogImage.length > 0
      ? result.ogImage[0].url
      : null;

  const type = detectType(url, result.ogType);

  return {
    url,
    title: result.ogTitle || null,
    description: result.ogDescription || null,
    image_url: ogImage,
    site_name: result.ogSiteName || null,
    favicon_url: result.favicon || null,
    type,
  };
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
