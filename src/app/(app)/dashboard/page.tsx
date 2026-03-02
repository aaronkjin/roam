"use client";

import { useState } from "react";
import { useTrips } from "@/context/TripsContext";
import { TripList } from "@/components/dashboard/TripList";
import { CreateTripModal } from "@/components/dashboard/CreateTripModal";
import { EditTripModal } from "@/components/dashboard/EditTripModal";
import { PixelWindow } from "@/components/pixel/PixelWindow";
import { Button } from "@/components/ui/button";
import { Plus, Compass } from "lucide-react";
import type { Trip } from "@/types/trip";

export default function DashboardPage() {
  const { ownTrips, sharedTrips, loading, updateTrip } = useTrips();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTrip, setEditTrip] = useState<Trip | null>(null);

  const activeTrips = ownTrips.filter(
    (t) => t.status !== "completed" && t.status !== "archived"
  );
  const pastTrips = ownTrips.filter(
    (t) => t.status === "completed" || t.status === "archived"
  );
  const activeShared = sharedTrips.filter(
    (t) => t.status !== "completed" && t.status !== "archived"
  );

  return (
    <div className="p-6 space-y-8">
      {/* Active trips */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base">Your Adventures</h2>
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            New Trip
          </Button>
        </div>

        {!loading && activeTrips.length === 0 && pastTrips.length === 0 && activeShared.length === 0 ? (
          <PixelWindow title="Welcome to Roam!" variant="jam">
            <div className="text-center py-8 space-y-4">
              <Compass className="w-16 h-16 text-jam mx-auto" />
              <p className="font-[family-name:var(--font-press-start)] text-sm text-night">
                Ready to explore?
              </p>
              <p className="text-sm text-rock max-w-md mx-auto">
                Create your first trip to start collecting inspiration and planning
                your next adventure.
              </p>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Create Your First Trip
              </Button>
            </div>
          </PixelWindow>
        ) : !loading && activeTrips.length === 0 ? (
          <p className="text-sm text-rock">No active trips. Start a new one!</p>
        ) : (
          <TripList trips={activeTrips} loading={loading} onEditTrip={setEditTrip} />
        )}
      </div>

      {/* Shared with me */}
      {(loading || activeShared.length > 0) && activeShared.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-base">Shared with Me</h2>
          <TripList trips={activeShared} loading={loading} onEditTrip={setEditTrip} />
        </div>
      )}

      {/* Past trips */}
      {(loading || pastTrips.length > 0) && (
        <div className="space-y-4">
          <h2 className="text-base">Past Trips</h2>
          <TripList trips={pastTrips} loading={loading} onEditTrip={setEditTrip} />
        </div>
      )}

      <CreateTripModal open={createOpen} onOpenChange={setCreateOpen} />
      <EditTripModal
        trip={editTrip}
        open={!!editTrip}
        onOpenChange={(open) => !open && setEditTrip(null)}
        onSave={updateTrip}
      />
    </div>
  );
}
