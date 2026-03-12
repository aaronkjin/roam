"use client";

import { useState, useCallback } from "react";

export interface BlockEditSuggestion {
  id: string;
  title?: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  location?: string;
  location_lat?: number;
  location_lng?: number;
  cost_estimate?: number;
  currency?: string;
  photo_query?: string;
}

export function useBlockAIEdit(tripId: string) {
  const [selectedBlockIds, setSelectedBlockIds] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [suggestions, setSuggestions] = useState<BlockEditSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleBlockSelection = useCallback((id: string) => {
    setSelectedBlockIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 10) {
        next.add(id);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedBlockIds(new Set());
    setIsSelectMode(false);
    setSuggestions([]);
    setError(null);
  }, []);

  const enterSelectMode = useCallback(() => {
    setIsSelectMode(true);
    setSuggestions([]);
    setError(null);
  }, []);

  const submitEdit = useCallback(
    async (instruction: string, contextBlocks?: unknown[]) => {
      if (selectedBlockIds.size === 0) return;

      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/itinerary/ai-edit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trip_id: tripId,
            block_ids: Array.from(selectedBlockIds),
            instruction,
            context_blocks: contextBlocks || [],
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "AI edit failed");
        }

        const data = await res.json();
        setSuggestions(data.suggestions || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    },
    [tripId, selectedBlockIds]
  );

  const acceptSuggestion = useCallback((blockId: string) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== blockId));
  }, []);

  const rejectSuggestion = useCallback((blockId: string) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== blockId));
  }, []);

  const acceptAll = useCallback(() => {
    const accepted = [...suggestions];
    setSuggestions([]);
    return accepted;
  }, [suggestions]);

  const rejectAll = useCallback(() => {
    setSuggestions([]);
  }, []);

  return {
    selectedBlockIds,
    isSelectMode,
    suggestions,
    loading,
    error,
    toggleBlockSelection,
    clearSelection,
    enterSelectMode,
    submitEdit,
    acceptSuggestion,
    rejectSuggestion,
    acceptAll,
    rejectAll,
  };
}
