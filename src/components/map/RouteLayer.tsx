"use client";

import { Source, Layer } from "react-map-gl/mapbox";
import type { ItineraryBlock } from "@/types/itinerary";

interface RouteLayerProps {
  blocks: ItineraryBlock[];
}

export function RouteLayer({ blocks }: RouteLayerProps) {
  const coords = blocks
    .filter((b) => b.location_lat && b.location_lng)
    .map((b) => [b.location_lng!, b.location_lat!]);

  if (coords.length < 2) return null;

  const geojson: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: coords,
        },
      },
    ],
  };

  return (
    <Source id="route" type="geojson" data={geojson}>
      <Layer
        id="route-line"
        type="line"
        paint={{
          "line-color": "#F4845F",
          "line-width": 4,
          "line-dasharray": [2, 2],
        }}
        layout={{
          "line-cap": "square",
          "line-join": "miter",
        }}
      />
    </Source>
  );
}
