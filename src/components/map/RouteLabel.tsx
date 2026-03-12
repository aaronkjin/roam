"use client";

import { Marker } from "react-map-gl/mapbox";
import { Route } from "lucide-react";

interface RouteLabelProps {
  longitude: number;
  latitude: number;
  distance: string;
}

export function RouteLabel({ longitude, latitude, distance }: RouteLabelProps) {
  return (
    <Marker longitude={longitude} latitude={latitude} anchor="center">
      <div className="flex items-center gap-1 bg-white/90 border-[2px] border-night px-1.5 py-0.5 pointer-events-none">
        <Route className="w-3 h-3 text-night shrink-0" />
        <span className="font-[family-name:var(--font-silkscreen)] text-[9px] text-night whitespace-nowrap">
          {distance}
        </span>
      </div>
    </Marker>
  );
}
