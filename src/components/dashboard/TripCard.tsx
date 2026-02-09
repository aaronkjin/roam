"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar } from "lucide-react";
import type { Trip } from "@/types/trip";

interface TripCardProps {
  trip: Trip;
}

const statusColors: Record<string, string> = {
  planning: "bg-mist text-night",
  generated: "bg-grass text-night",
  finalized: "bg-moss text-white",
  archived: "bg-rock text-white",
};

export function TripCard({ trip }: TripCardProps) {
  return (
    <Link href={`/trip/${trip.id}/inspo`}>
      <div className="border-[3px] border-night bg-white pixel-shadow pixel-shadow-hover p-4 space-y-3 h-full">
        {/* Cover image or placeholder */}
        {trip.cover_image_url ? (
          <div className="h-32 border-[2px] border-night overflow-hidden -mx-4 -mt-4 mb-3">
            <img
              src={trip.cover_image_url}
              alt={trip.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="h-32 border-[2px] border-night bg-gradient-to-br from-mist to-sky flex items-center justify-center -mx-4 -mt-4 mb-3">
            <MapPin className="w-8 h-8 text-night/40" />
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-bold text-night line-clamp-1">
              {trip.title}
            </h4>
            <Badge className={`text-[9px] shrink-0 ${statusColors[trip.status] || statusColors.planning}`}>
              {trip.status}
            </Badge>
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

          {(trip.start_date || trip.end_date) && (
            <p className="flex items-center gap-1 text-[10px] text-rock">
              <Calendar className="w-3 h-3" />
              {trip.start_date}
              {trip.end_date && ` — ${trip.end_date}`}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
