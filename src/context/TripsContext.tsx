"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { Trip, TripWithRole, CreateTripInput, UpdateTripInput } from "@/types/trip";

interface TripsContextValue {
  trips: TripWithRole[];
  ownTrips: TripWithRole[];
  sharedTrips: TripWithRole[];
  loading: boolean;
  error: string | null;
  fetchTrips: () => Promise<void>;
  createTrip: (input: CreateTripInput) => Promise<Trip | null>;
  updateTrip: (id: string, input: UpdateTripInput) => Promise<Trip | null>;
  deleteTrip: (id: string) => Promise<boolean>;
  acceptInvite: (tripId: string) => Promise<boolean>;
}

const TripsContext = createContext<TripsContextValue | null>(null);

export function TripsProvider({ children }: { children: React.ReactNode }) {
  const [ownTrips, setOwnTrips] = useState<TripWithRole[]>([]);
  const [sharedTrips, setSharedTrips] = useState<TripWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const trips = [...ownTrips, ...sharedTrips];

  const fetchTrips = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/trips");
      if (!res.ok) throw new Error("Failed to fetch trips");
      const data = await res.json();

      // Support both new { ownTrips, sharedTrips } and legacy array format
      if (data.ownTrips && data.sharedTrips) {
        setOwnTrips(data.ownTrips);
        setSharedTrips(data.sharedTrips);
      } else if (Array.isArray(data)) {
        setOwnTrips(data.map((t: Trip) => ({ ...t, userRole: "owner" as const })));
        setSharedTrips([]);
      }
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
      const tripWithRole: TripWithRole = { ...trip, userRole: "owner" };
      setOwnTrips((prev) => [tripWithRole, ...prev]);
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
      // Update in whichever list contains the trip
      setOwnTrips((prev) =>
        prev.map((t) => (t.id === id ? { ...updated, userRole: t.userRole } : t))
      );
      setSharedTrips((prev) =>
        prev.map((t) => (t.id === id ? { ...updated, userRole: t.userRole } : t))
      );
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return null;
    }
  }, []);

  const deleteTrip = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/trips", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed to delete trip");
      setOwnTrips((prev) => prev.filter((t) => t.id !== id));
      setSharedTrips((prev) => prev.filter((t) => t.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return false;
    }
  }, []);

  const acceptInvite = useCallback(async (tripId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/trips/${tripId}/collaborators/accept`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to accept invite");
      // Refresh trips to get updated accepted_at
      await fetchTrips();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return false;
    }
  }, [fetchTrips]);

  return (
    <TripsContext.Provider
      value={{
        trips,
        ownTrips,
        sharedTrips,
        loading,
        error,
        fetchTrips,
        createTrip,
        updateTrip,
        deleteTrip,
        acceptInvite,
      }}
    >
      {children}
    </TripsContext.Provider>
  );
}

export function useTrips() {
  const ctx = useContext(TripsContext);
  if (!ctx) throw new Error("useTrips must be used within a TripsProvider");
  return ctx;
}
