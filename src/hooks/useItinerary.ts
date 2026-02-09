"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { ItineraryDay, ItineraryBlock, CreateBlockInput, UpdateBlockInput } from "@/types/itinerary";

export function useItinerary(tripId: string) {
  const [days, setDays] = useState<(ItineraryDay & { blocks: ItineraryBlock[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchItinerary = useCallback(async () => {
    if (!tripId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/itinerary?trip_id=${tripId}`);
      if (!res.ok) throw new Error("Failed to fetch itinerary");
      const data = await res.json();
      setDays(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    fetchItinerary();
  }, [fetchItinerary]);

  const addBlock = useCallback(
    async (input: CreateBlockInput): Promise<ItineraryBlock | null> => {
      try {
        const res = await fetch("/api/itinerary/blocks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        if (!res.ok) throw new Error("Failed to add block");
        const block = await res.json();

        // Optimistic update
        setDays((prev) =>
          prev.map((day) =>
            day.id === input.day_id
              ? { ...day, blocks: [...day.blocks, block] }
              : day
          )
        );

        return block;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return null;
      }
    },
    []
  );

  const updateBlock = useCallback(
    async (blockId: string, input: UpdateBlockInput) => {
      // Optimistic update immediately
      setDays((prev) =>
        prev.map((day) => ({
          ...day,
          blocks: day.blocks.map((block) =>
            block.id === blockId ? { ...block, ...input } : block
          ),
        }))
      );

      // Debounced save to API
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/itinerary/blocks/${blockId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          });
          if (!res.ok) throw new Error("Failed to update block");
        } catch (err) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      }, 500);
    },
    []
  );

  const deleteBlock = useCallback(async (blockId: string) => {
    // Optimistic update
    setDays((prev) =>
      prev.map((day) => ({
        ...day,
        blocks: day.blocks.filter((b) => b.id !== blockId),
      }))
    );

    try {
      const res = await fetch(`/api/itinerary/blocks/${blockId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete block");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      fetchItinerary(); // Revert on error
    }
  }, [fetchItinerary]);

  const reorderBlocks = useCallback(
    async (updates: { id: string; position_index: number; day_id?: string }[]) => {
      try {
        const res = await fetch("/api/itinerary/blocks/reorder", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blocks: updates }),
        });
        if (!res.ok) throw new Error("Failed to reorder blocks");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        fetchItinerary(); // Revert on error
      }
    },
    [fetchItinerary]
  );

  const updateDay = useCallback(
    async (dayId: string, input: { title?: string; summary?: string }) => {
      setDays((prev) =>
        prev.map((day) => (day.id === dayId ? { ...day, ...input } : day))
      );

      try {
        const res = await fetch(`/api/itinerary/days/${dayId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        if (!res.ok) throw new Error("Failed to update day");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    },
    []
  );

  return {
    days,
    loading,
    error,
    fetchItinerary,
    addBlock,
    updateBlock,
    deleteBlock,
    reorderBlocks,
    updateDay,
    setDays,
  };
}
