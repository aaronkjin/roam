"use client";

import { useState } from "react";
import { useTrips } from "@/hooks/useTrips";
import { TripList } from "@/components/dashboard/TripList";
import { CreateTripModal } from "@/components/dashboard/CreateTripModal";
import { PixelWindow } from "@/components/pixel/PixelWindow";
import { Button } from "@/components/ui/button";
import { Plus, Compass } from "lucide-react";

export default function DashboardPage() {
  const { trips, loading } = useTrips();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base">Your Adventures</h2>
        <Button onClick={() => setCreateOpen(true)} size="sm">
          <Plus className="w-4 h-4 mr-1" />
          New Trip
        </Button>
      </div>

      {!loading && trips.length === 0 ? (
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
      ) : (
        <TripList trips={trips} loading={loading} />
      )}

      <CreateTripModal open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
