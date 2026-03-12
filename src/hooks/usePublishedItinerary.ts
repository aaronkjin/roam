"use client";

import { useState, useEffect, useCallback } from "react";
import type { PublishedItinerary } from "@/types/feed";
import type { ItineraryDay, ItineraryBlock } from "@/types/itinerary";

interface PublishedItineraryState {
  published: PublishedItinerary | null;
  days: (ItineraryDay & { blocks: ItineraryBlock[] })[];
  loading: boolean;
  error: string | null;
}

export function usePublishedItinerary(slug: string) {
  const [state, setState] = useState<PublishedItineraryState>({
    published: null,
    days: [],
    loading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    if (!slug) return;
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const res = await fetch(`/api/feed/${slug}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      setState({
        published: data.published,
        days: data.days,
        loading: false,
        error: null,
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Unknown error",
      }));
    }
  }, [slug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleLike = useCallback(async () => {
    if (!state.published) return;
    const prev = state.published;

    // Optimistic update
    setState((s) => ({
      ...s,
      published: s.published
        ? {
            ...s.published,
            is_liked: !s.published.is_liked,
            like_count: s.published.is_liked
              ? s.published.like_count - 1
              : s.published.like_count + 1,
          }
        : null,
    }));

    try {
      const res = await fetch(`/api/feed/${slug}/like`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
    } catch {
      setState((s) => ({ ...s, published: prev }));
    }
  }, [slug, state.published]);

  const toggleSave = useCallback(async () => {
    if (!state.published) return;
    const prev = state.published;

    setState((s) => ({
      ...s,
      published: s.published
        ? {
            ...s.published,
            is_saved: !s.published.is_saved,
            save_count: s.published.is_saved
              ? s.published.save_count - 1
              : s.published.save_count + 1,
          }
        : null,
    }));

    try {
      const res = await fetch(`/api/feed/${slug}/save`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
    } catch {
      setState((s) => ({ ...s, published: prev }));
    }
  }, [slug, state.published]);

  const forkItinerary = useCallback(async (title?: string) => {
    const res = await fetch(`/api/feed/${slug}/fork`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) throw new Error("Failed to fork itinerary");
    const trip = await res.json();

    // Update fork count
    setState((s) => ({
      ...s,
      published: s.published
        ? { ...s.published, fork_count: s.published.fork_count + 1 }
        : null,
    }));

    return trip;
  }, [slug]);

  return {
    ...state,
    toggleLike,
    toggleSave,
    forkItinerary,
    refetch: fetchData,
  };
}
