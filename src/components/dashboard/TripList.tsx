"use client";

import { TripCard } from "./TripCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { Trip } from "@/types/trip";

interface TripListProps {
  trips: Trip[];
  loading: boolean;
}

export function TripList({ trips, loading }: TripListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-56" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {trips.map((trip) => (
        <TripCard key={trip.id} trip={trip} />
      ))}
    </div>
  );
}
