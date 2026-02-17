"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { Trip, CreateTripInput, UpdateTripInput } from "@/types/trip";

interface TripsContextValue {
  trips: Trip[];
  loading: boolean;
  error: string | null;
  fetchTrips: () => Promise<void>;
  createTrip: (input: CreateTripInput) => Promise<Trip | null>;
  updateTrip: (id: string, input: UpdateTripInput) => Promise<Trip | null>;
}

const TripsContext = createContext<TripsContextValue | null>(null);

export function TripsProvider({ children }: { children: React.ReactNode }) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrips = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/trips");
      if (!res.ok) throw new Error("Failed to fetch trips");
      const data = await res.json();
      setTrips(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const createTrip = useCallback(async (input: CreateTripInput): Promise<Trip | null> => {
    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Failed to create trip");
      const trip = await res.json();
      setTrips((prev) => [trip, ...prev]);
      return trip;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return null;
    }
  }, []);

  const updateTrip = useCallback(async (id: string, input: UpdateTripInput): Promise<Trip | null> => {
    try {
      const res = await fetch("/api/trips", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...input }),
      });
      if (!res.ok) throw new Error("Failed to update trip");
      const updated = await res.json();
      setTrips((prev) => prev.map((t) => (t.id === id ? updated : t)));
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return null;
    }
  }, []);

  return (
    <TripsContext.Provider value={{ trips, loading, error, fetchTrips, createTrip, updateTrip }}>
      {children}
    </TripsContext.Provider>
  );
}

export function useTrips() {
  const ctx = useContext(TripsContext);
  if (!ctx) throw new Error("useTrips must be used within a TripsProvider");
  return ctx;
}
