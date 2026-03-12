"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Edit2 } from "lucide-react";
import type { Trip, TripWithRole } from "@/types/trip";
import { getProxiedImageUrl } from "@/lib/image-proxy";
import { formatTripDateRange } from "@/lib/trip-dates";

interface TripCardProps {
  trip: Trip;
  onEdit: (trip: Trip) => void;
}

const statusColors: Record<string, string> = {
  planning: "bg-mist text-night",
  generated: "bg-grass text-night",
  finalized: "bg-moss text-white",
  archived: "bg-rock text-white",
  completed: "bg-jam text-white",
};

const roleColors: Record<string, string> = {
  editor: "bg-grass text-night",
  viewer: "bg-sky text-night",
};

function isTripWithRole(trip: Trip): trip is TripWithRole {
  return "userRole" in trip;
}

export function TripCard({ trip, onEdit }: TripCardProps) {
  const userRole = isTripWithRole(trip) ? trip.userRole : "owner";
  const canEdit = userRole === "owner" || userRole === "editor";
  const isShared = userRole !== "owner";
  const tripTiming = formatTripDateRange({
    startDate: trip.start_date,
    endDate: trip.end_date,
    dateRangeLabel: trip.date_range_label,
  });

  return (
    <div className="border-[3px] border-night bg-white pixel-shadow pixel-shadow-hover h-full relative group">
      {/* Edit button - top right, appears on hover (only for owner/editor) */}
      {canEdit && (
        <Button
          variant="outline"
          size="icon"
          className="absolute top-2 right-2 z-10 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity bg-white"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEdit(trip);
          }}
        >
          <Edit2 className="w-3.5 h-3.5" />
        </Button>
      )}

      <Link href={`/trip/${trip.id}/inspo`} className="block p-4 space-y-3">
        {/* Cover image or placeholder */}
        {trip.cover_image_url ? (
          <div className="h-80 border-[2px] border-night overflow-hidden -mx-4 -mt-4 mb-3">
            <img
              src={getProxiedImageUrl(trip.cover_image_url)}
              alt={trip.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="h-80 border-[2px] border-night bg-gradient-to-br from-mist to-sky flex items-center justify-center -mx-4 -mt-4 mb-3">
            <MapPin className="w-8 h-8 text-night/40" />
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-bold text-night line-clamp-1">
              {trip.title}
            </h4>
            <div className="flex items-center gap-1 shrink-0">
              {isShared && (
                <Badge className={`text-[9px] ${roleColors[userRole] || ""}`}>
                  {userRole}
                </Badge>
              )}
              <Badge className={`text-[9px] ${statusColors[trip.status] || statusColors.planning}`}>
                {trip.status}
              </Badge>
            </div>
          </div>

          {trip.destination && (
            <p className="flex items-center gap-1 text-xs text-rock">
              <MapPin className="w-3 h-3" />
              {trip.destination}
            </p>
          )}

          {trip.description && (
            <p className="text-xs text-rock line-clamp-2">{trip.description}</p>
          )}

          {tripTiming && (
            <p className="flex items-center gap-1 text-[10px] text-rock">
              <Calendar className="w-3 h-3" />
              {tripTiming}
            </p>
          )}
        </div>
      </Link>
    </div>
  );
}
