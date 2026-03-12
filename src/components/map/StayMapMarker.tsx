"use client";

import { Marker } from "react-map-gl/mapbox";
import { Home } from "lucide-react";

interface StayMapMarkerProps {
  lat: number;
  lng: number;
  address: string;
  onClick?: () => void;
}

export function StayMapMarker({ lat, lng, address, onClick }: StayMapMarkerProps) {
  return (
    <Marker
      latitude={lat}
      longitude={lng}
      anchor="center"
      onClick={(e) => {
        e.originalEvent.stopPropagation();
        onClick?.();
      }}
    >
      <div
        className="flex items-center justify-center w-9 h-9 border-[3px] border-night bg-moss pixel-shadow-sm cursor-pointer"
        title={address}
      >
        <Home className="w-4 h-4 text-white" />
      </div>
    </Marker>
  );
}
