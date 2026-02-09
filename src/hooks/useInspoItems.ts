"use client";

import { useState, useEffect, useCallback } from "react";
import type { InspoItem, CreateInspoInput, UpdateInspoInput } from "@/types/inspo";

export function useInspoItems(tripId: string) {
  const [items, setItems] = useState<InspoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    if (!tripId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/inspo?trip_id=${tripId}`);
      if (!res.ok) throw new Error("Failed to fetch inspo items");
      const data = await res.json();
      setItems(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const addItem = useCallback(
    async (input: Omit<CreateInspoInput, "trip_id">): Promise<InspoItem | null> => {
      try {
        const res = await fetch("/api/inspo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...input, trip_id: tripId }),
        });
        if (!res.ok) throw new Error("Failed to add inspo item");
        const item = await res.json();
        setItems((prev) => [...prev, item]);
        return item;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return null;
      }
    },
    [tripId]
  );

  const updateItem = useCallback(
    async (id: string, input: UpdateInspoInput): Promise<InspoItem | null> => {
      try {
        const res = await fetch(`/api/inspo/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        if (!res.ok) throw new Error("Failed to update inspo item");
        const updated = await res.json();
        setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
        return updated;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return null;
      }
    },
    []
  );

  const deleteItem = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/inspo/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete inspo item");
      setItems((prev) => prev.filter((item) => item.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return false;
    }
  }, []);

  return { items, loading, error, fetchItems, addItem, updateItem, deleteItem };
}
