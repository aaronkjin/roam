"use client";

import { useState, useCallback, useRef } from "react";
import type { ItineraryBlock } from "@/types/itinerary";

export interface PlaceDetails {
  rating?: number;
  price_range?: string;
  opening_hours?: string | null;
  reviews?: { text: string; source: string; rating: number }[];
  why_people_love_it?: string[];
  need_to_know?: string[];
  booking_url?: string | null;
  official_website?: string | null;
  google_maps_url?: string | null;
  photos?: string[];
  yelp_url?: string;
  tripadvisor_url?: string;
  google_maps_search_url?: string;
}

// In-memory cache to avoid re-fetching on modal re-open
const detailsCache = new Map<string, PlaceDetails>();

export function usePlaceDetails() {
  const [data, setData] = useState<PlaceDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchDetails = useCallback(async (block: ItineraryBlock) => {
    // Check cache — only use if it has actual AI content (not a failed/empty fetch)
    const cached = detailsCache.get(block.id);
    if (cached && (cached.why_people_love_it?.length || cached.reviews?.length || cached.rating)) {
      setData(cached);
      return;
    }

    setLoading(true);
    setError(null);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/places/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: block.title,
          location: block.location,
          type: block.type,
          description: block.description,
          lat: block.location_lat,
          lng: block.location_lng,
        }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error("Failed to fetch place details");

      const result: PlaceDetails = await res.json();
      detailsCache.set(block.id, result);
      setData(result);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, fetchDetails, reset };
}
