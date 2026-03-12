/**
 * Pexels image fetching with retry/fallback logic.
 */

const PEXELS_API_URL = "https://api.pexels.com/v1/search";

interface PexelsPhoto {
  src: {
    large: string;
    medium: string;
    landscape: string;
  };
  width: number;
  height: number;
}

/**
 * Fetch a landscape-oriented image from Pexels with retry logic.
 * Tries the primary query first, then each fallback query in order.
 * Returns the best landscape result URL, or null if all fail.
 */
export async function fetchPexelsImage(
  query: string,
  fallbackQueries?: string[]
): Promise<string | null> {
  const pexelsKey = process.env.PEXELS_API_KEY;
  if (!pexelsKey) return null;

  const queries = [query, ...(fallbackQueries || [])];

  for (const q of queries) {
    try {
      const res = await fetch(
        `${PEXELS_API_URL}?query=${encodeURIComponent(q)}&per_page=5&orientation=landscape`,
        { headers: { Authorization: pexelsKey } }
      );
      if (!res.ok) continue;

      const data = await res.json();
      const photos: PexelsPhoto[] = data.photos || [];

      if (photos.length === 0) continue;

      // Prefer landscape-oriented photos (width > height)
      const landscape = photos.filter((p) => p.width > p.height);
      const best = landscape.length > 0 ? landscape[0] : photos[0];
      return best.src.large;
    } catch {
      continue;
    }
  }

  return null;
}

/**
 * Build fallback queries for a block's photo search.
 * Progressively broadens the query to increase match likelihood.
 */
export function buildFallbackQueries(
  title: string,
  type: string,
  location?: string | null
): string[] {
  const fallbacks: string[] = [];
  // Extract city from location (last part after comma)
  const city = location?.split(",").pop()?.trim() || "";

  if (city) {
    fallbacks.push(`${type} ${city}`);
    fallbacks.push(`${city} travel landmark`);
  }
  fallbacks.push(`${title} ${type}`);
  return fallbacks;
}
