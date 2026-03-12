"use client";

import { useState, useEffect, useCallback } from "react";
import type { PublishedItinerary, FeedFilters } from "@/types/feed";

interface FeedState {
  items: PublishedItinerary[];
  total: number;
  page: number;
  hasMore: boolean;
  loading: boolean;
  error: string | null;
}

interface UseFeedOptions {
  savedOnly?: boolean;
}

export function useFeed(initialFilters?: FeedFilters, options?: UseFeedOptions) {
  const savedOnly = options?.savedOnly ?? false;
  const [filters, setFilters] = useState<FeedFilters>({
    destination: "",
    sort: "recent",
    page: 1,
    limit: 20,
    ...initialFilters,
  });
  const [state, setState] = useState<FeedState>({
    items: [],
    total: 0,
    page: 1,
    hasMore: false,
    loading: true,
    error: null,
  });

  const fetchFeed = useCallback(async (f: FeedFilters, append = false) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      let res: Response;

      if (savedOnly) {
        res = await fetch("/api/feed/saved");
      } else {
        const params = new URLSearchParams();
        if (f.destination) params.set("destination", f.destination);
        if (f.sort) params.set("sort", f.sort);
        params.set("page", String(f.page || 1));
        params.set("limit", String(f.limit || 20));
        res = await fetch(`/api/feed?${params.toString()}`);
      }

      if (!res.ok) throw new Error("Failed to fetch feed");
      const data = await res.json();

      setState((prev) => ({
        items: append ? [...prev.items, ...data.items] : data.items,
        total: savedOnly ? data.items.length : data.total,
        page: savedOnly ? 1 : data.page,
        hasMore: savedOnly ? false : data.hasMore,
        loading: false,
        error: null,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Unknown error",
      }));
    }
  }, [savedOnly]);

  useEffect(() => {
    fetchFeed(filters);
  }, [filters.destination, filters.sort, savedOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = useCallback(() => {
    if (savedOnly) return;
    const nextPage = (filters.page || 1) + 1;
    const newFilters = { ...filters, page: nextPage };
    setFilters(newFilters);
    fetchFeed(newFilters, true);
  }, [savedOnly, filters, fetchFeed]);

  const updateFilters = useCallback((update: Partial<FeedFilters>) => {
    setFilters((prev) => ({ ...prev, ...update, page: 1 }));
  }, []);

  const refreshFeed = useCallback(() => {
    fetchFeed(filters);
  }, [filters, fetchFeed]);

  // Optimistic like toggle for a feed item
  const toggleLike = useCallback(async (slug: string) => {
    const item = state.items.find((i) => i.slug === slug);
    if (!item) return;

    // Optimistic update
    setState((prev) => ({
      ...prev,
      items: prev.items.map((i) =>
        i.slug === slug
          ? {
              ...i,
              is_liked: !i.is_liked,
              like_count: i.is_liked ? i.like_count - 1 : i.like_count + 1,
            }
          : i
      ),
    }));

    try {
      const res = await fetch(`/api/feed/${slug}/like`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to toggle like");
    } catch {
      // Revert on error
      setState((prev) => ({
        ...prev,
        items: prev.items.map((i) =>
          i.slug === slug
            ? {
                ...i,
                is_liked: item.is_liked,
                like_count: item.like_count,
              }
            : i
        ),
      }));
    }
  }, [state.items]);

  // Optimistic save toggle for a feed item
  const toggleSave = useCallback(async (slug: string) => {
    const item = state.items.find((i) => i.slug === slug);
    if (!item) return;

    setState((prev) => ({
      ...prev,
      items: savedOnly
        ? prev.items.filter((i) => i.slug !== slug)
        : prev.items.map((i) =>
            i.slug === slug
              ? {
                  ...i,
                  is_saved: !i.is_saved,
                  save_count: i.is_saved ? i.save_count - 1 : i.save_count + 1,
                }
              : i
          ),
      total: savedOnly ? Math.max(prev.total - 1, 0) : prev.total,
    }));

    try {
      const res = await fetch(`/api/feed/${slug}/save`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to toggle save");
    } catch {
      if (savedOnly) {
        fetchFeed(filters);
        return;
      }

      setState((prev) => ({
        ...prev,
        items: prev.items.map((i) =>
          i.slug === slug
            ? {
                ...i,
                is_saved: item.is_saved,
                save_count: item.save_count,
              }
            : i
        ),
      }));
    }
  }, [savedOnly, state.items, fetchFeed, filters]);

  // Remove a post (unpublish)
  const removePost = useCallback(async (tripId: string, slug: string) => {
    // Optimistic removal
    setState((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.slug !== slug),
      total: prev.total - 1,
    }));

    try {
      const res = await fetch("/api/feed/publish", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trip_id: tripId }),
      });
      if (!res.ok) throw new Error("Failed to remove post");
    } catch {
      // Revert on error
      fetchFeed(filters);
    }
  }, [filters, fetchFeed]);

  return {
    ...state,
    filters,
    updateFilters,
    loadMore,
    refreshFeed,
    toggleLike,
    toggleSave,
    removePost,
  };
}
