"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import Map, { Source, Layer, type MapRef } from "react-map-gl/mapbox";
import { PixelMapMarker } from "./PixelMapMarker";
import { RouteLayer } from "./RouteLayer";
import { MapPopup } from "./MapPopup";
import { MapControls } from "./MapControls";
import { MapDaySelector } from "./MapDaySelector";
import { MapPin } from "lucide-react";
import type { ItineraryBlock } from "@/types/itinerary";

import "mapbox-gl/dist/mapbox-gl.css";

interface ItineraryMapProps {
  blocks: ItineraryBlock[];
  activeBlockId: string | null;
  onBlockSelect: (blockId: string) => void;
  dayCount: number;
  activeDayIndex: number;
  onDaySelect: (index: number) => void;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

export function ItineraryMap({
  blocks,
  activeBlockId,
  onBlockSelect,
  dayCount,
  activeDayIndex,
  onDaySelect,
}: ItineraryMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [popupBlockId, setPopupBlockId] = useState<string | null>(null);
  const [is3D, setIs3D] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);

  const mappableBlocks = useMemo(
    () =>
      blocks.filter(
        (b) =>
          b.location_lat &&
          b.location_lng &&
          b.type !== "heading" &&
          b.type !== "note",
      ),
    [blocks],
  );

  // Stable key for triggering fitBounds (based on block IDs)
  const blockKey = useMemo(
    () => mappableBlocks.map((b) => b.id).join(","),
    [mappableBlocks],
  );

  const fitToBounds = useCallback(() => {
    const map = mapRef.current;
    if (!map || mappableBlocks.length === 0) return;

    if (mappableBlocks.length === 1) {
      map.flyTo({
        center: [
          mappableBlocks[0].location_lng!,
          mappableBlocks[0].location_lat!,
        ],
        zoom: 14,
        pitch: is3D ? 45 : 0,
        bearing: is3D ? -17.6 : 0,
        duration: 1200,
      });
      return;
    }

    const lngs = mappableBlocks.map((b) => b.location_lng!);
    const lats = mappableBlocks.map((b) => b.location_lat!);

    map.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      {
        padding: 80,
        pitch: is3D ? 45 : 0,
        bearing: is3D ? -17.6 : 0,
        duration: 1200,
      },
    );
  }, [mappableBlocks, is3D]);

  // Fit bounds when day changes (blocks change) — use stable blockKey
  useEffect(() => {
    if (!mapLoaded) return;
    const timer = setTimeout(fitToBounds, 200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockKey, mapLoaded]);

  const handleMarkerClick = useCallback(
    (blockId: string) => {
      setPopupBlockId((prev) => (prev === blockId ? null : blockId));
      onBlockSelect(blockId);
    },
    [onBlockSelect],
  );

  const handleZoomIn = useCallback(() => {
    mapRef.current?.zoomIn({ duration: 300 });
  }, []);

  const handleZoomOut = useCallback(() => {
    mapRef.current?.zoomOut({ duration: 300 });
  }, []);

  const handleToggle3D = useCallback(() => {
    const next = !is3D;
    setIs3D(next);
    mapRef.current?.easeTo({
      pitch: next ? 45 : 0,
      bearing: next ? -17.6 : 0,
      duration: 600,
    });
  }, [is3D]);

  const handleMapLoad = useCallback(() => {
    setMapLoaded(true);
    const map = mapRef.current?.getMap();
    if (!map) return;

    // Add terrain DEM source for 3D
    if (!map.getSource("mapbox-dem")) {
      map.addSource("mapbox-dem", {
        type: "raster-dem",
        url: "mapbox://mapbox.mapbox-terrain-dem-v1",
        tileSize: 512,
        maxzoom: 14,
      });
    }

    // Apply pixel-art style overrides
    try {
      const style = map.getStyle();
      if (style?.layers) {
        for (const l of style.layers) {
          // Tint water to mist color
          if (l.id.includes("water") && l.type === "fill") {
            map.setPaintProperty(l.id, "fill-color", "#A8D8EA");
          }
          // Tint land/background to milk
          if (l.type === "background") {
            map.setPaintProperty(l.id, "background-color", "#F7F7F7");
          }
          if (l.id.includes("land") && l.type === "fill") {
            try {
              map.setPaintProperty(l.id, "fill-color", "#F7F7F7");
            } catch {
              // Some layers may not support direct fill-color
            }
          }
        }
      }
    } catch {
      // Style modification is cosmetic only
    }
  }, []);

  const popupBlock = popupBlockId
    ? mappableBlocks.find((b) => b.id === popupBlockId) || null
    : null;

  // No token configured
  if (!MAPBOX_TOKEN) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-mist/20">
        <div className="text-center space-y-2 p-6">
          <MapPin className="w-10 h-10 text-rock mx-auto" />
          <p className="font-[family-name:var(--font-silkscreen)] text-sm text-night">
            Map Not Configured
          </p>
        </div>
      </div>
    );
  }

  // No pins to show
  if (mappableBlocks.length === 0) {
    return (
      <div className="relative w-full h-full">
        <Map
          ref={mapRef}
          mapboxAccessToken={MAPBOX_TOKEN}
          mapStyle="mapbox://styles/mapbox/light-v11"
          initialViewState={{
            longitude: 0,
            latitude: 20,
            zoom: 2,
            pitch: 0,
            bearing: 0,
          }}
          onLoad={handleMapLoad}
          attributionControl={false}
          style={{ width: "100%", height: "100%" }}
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white/90 border-[3px] border-night pixel-shadow p-4 text-center space-y-2">
            <MapPin className="w-8 h-8 text-rock mx-auto" />
            <p className="font-[family-name:var(--font-silkscreen)] text-xs text-night">
              Geocoding locations...
            </p>
            <p className="text-[10px] text-rock max-w-[180px]">
              Pins will appear as coordinates are resolved.
            </p>
          </div>
        </div>
        <MapDaySelector
          dayCount={dayCount}
          activeDayIndex={activeDayIndex}
          onDaySelect={onDaySelect}
        />
      </div>
    );
  }

  let markerIndex = 0;

  return (
    <div className="relative w-full h-full">
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/light-v11"
        initialViewState={{
          longitude: mappableBlocks[0].location_lng!,
          latitude: mappableBlocks[0].location_lat!,
          zoom: 12,
          pitch: 45,
          bearing: -17.6,
        }}
        terrain={{ source: "mapbox-dem", exaggeration: 1.5 }}
        onLoad={handleMapLoad}
        onClick={() => setPopupBlockId(null)}
        attributionControl={false}
        style={{ width: "100%", height: "100%" }}
      >
        {/* Terrain DEM source for 3D elevation */}
        <Source
          id="mapbox-dem"
          type="raster-dem"
          url="mapbox://mapbox.mapbox-terrain-dem-v1"
          tileSize={512}
          maxzoom={14}
        />

        {/* Sky layer for 3D atmosphere */}
        <Layer
          id="sky"
          type="sky"
          paint={{
            "sky-type": "atmosphere",
            "sky-atmosphere-sun": [0, 0],
            "sky-atmosphere-sun-intensity": 15,
          }}
        />

        <RouteLayer blocks={mappableBlocks} />

        {mappableBlocks.map((block) => {
          markerIndex++;
          return (
            <PixelMapMarker
              key={block.id}
              block={block}
              index={markerIndex}
              isActive={block.id === activeBlockId || block.id === popupBlockId}
              onClick={handleMarkerClick}
            />
          );
        })}

        {popupBlock && (
          <MapPopup block={popupBlock} onClose={() => setPopupBlockId(null)} />
        )}
      </Map>

      <MapDaySelector
        dayCount={dayCount}
        activeDayIndex={activeDayIndex}
        onDaySelect={onDaySelect}
      />

      <MapControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onToggle3D={handleToggle3D}
        onResetView={fitToBounds}
        is3D={is3D}
      />
    </div>
  );
}
