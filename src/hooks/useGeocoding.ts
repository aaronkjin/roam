"use client";

import { useEffect, useRef, useCallback } from "react";
import type { ItineraryBlock, UpdateBlockInput } from "@/types/itinerary";

interface UseGeocodingOptions {
  blocks: ItineraryBlock[];
  updateBlock: (blockId: string, input: UpdateBlockInput) => void;
  /** Trip destination for geocoding context (e.g., "Kyoto, Japan") */
  destination?: string | null;
}

/**
 * Strip common activity prefixes from block titles to extract the actual place name.
 * "Breakfast at Cafe Onion Seongsu" → "Cafe Onion Seongsu"
 * "Visit Ihwa Mural Village" → "Ihwa Mural Village"
 * "Travel to Namsan Seoul Tower" → "Namsan Seoul Tower"
 */
function stripActivityPrefix(title: string): string {
  const prefixes = [
    /^breakfast\s+at\s+/i,
    /^lunch\s+at\s+/i,
    /^dinner\s+at\s+/i,
    /^brunch\s+at\s+/i,
    /^snack\s+at\s+/i,
    /^drinks?\s+at\s+/i,
    /^coffee\s+at\s+/i,
    /^eat\s+at\s+/i,
    /^dine\s+at\s+/i,
    /^travel\s+to\s+/i,
    /^walk\s+to\s+/i,
    /^taxi\s+to\s+/i,
    /^bus\s+to\s+/i,
    /^train\s+to\s+/i,
    /^drive\s+to\s+/i,
    /^head\s+to\s+/i,
    /^go\s+to\s+/i,
    /^transfer\s+to\s+/i,
    /^check[\s-]*in\s+at\s+/i,
    /^check[\s-]*out\s+from\s+/i,
    /^stay\s+at\s+/i,
    /^visit\s+/i,
    /^explore\s+/i,
    /^tour\s+/i,
    /^see\s+/i,
    /^discover\s+/i,
    /^wander\s+/i,
    /^stroll\s+through\s+/i,
    /^stroll\s+/i,
    /^shop\s+at\s+/i,
    /^shopping\s+at\s+/i,
    /^hike\s+to\s+/i,
    /^hike\s+/i,
    /^climb\s+/i,
    /^relax\s+at\s+/i,
  ];

  let result = title;
  for (const prefix of prefixes) {
    result = result.replace(prefix, "");
    if (result !== title) break; // Only strip one prefix
  }
  return result.trim();
}

/** Derive a geocodable query from a block. Falls back to title (with prefix stripped) if location is null. */
function getGeoQuery(block: ItineraryBlock, destination?: string | null): string | null {
  // Prefer explicit location field; fall back to cleaned title
  const base = block.location || stripActivityPrefix(block.title);
  if (!base) return null;
  // Append destination for context if not already included
  if (destination && !base.toLowerCase().includes(destination.toLowerCase())) {
    return `${base}, ${destination}`;
  }
  return base;
}

export function useGeocoding({ blocks, updateBlock, destination }: UseGeocodingOptions) {
  const geocodedIdsRef = useRef<Set<string>>(new Set());
  const pendingRef = useRef(false);

  const geocodeBlock = useCallback(
    async (block: ItineraryBlock) => {
      if (geocodedIdsRef.current.has(block.id)) return;
      geocodedIdsRef.current.add(block.id);

      const query = getGeoQuery(block, destination);
      if (!query) return;

      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.lat && data.lng) {
          updateBlock(block.id, {
            location_lat: data.lat,
            location_lng: data.lng,
          });
        }
      } catch {
        // Silently fail — coordinate is optional
      }
    },
    [updateBlock, destination]
  );

  // Use a stable key derived from block IDs to avoid re-running on every render
  const blockIds = blocks.map((b) => b.id).join(",");

  useEffect(() => {
    if (pendingRef.current) return;

    const missing = blocks.filter(
      (b) =>
        !b.location_lat &&
        !b.location_lng &&
        b.type !== "heading" &&
        b.type !== "note" &&
        !geocodedIdsRef.current.has(b.id) &&
        getGeoQuery(b, destination) // Has something to geocode
    );

    if (missing.length === 0) return;

    pendingRef.current = true;

    (async () => {
      for (const block of missing) {
        await geocodeBlock(block);
        await new Promise((r) => setTimeout(r, 200));
      }
      pendingRef.current = false;
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockIds]);
}
