"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import MapGL, { Source, Layer, type MapRef } from "react-map-gl/mapbox";
import { PixelMapMarker } from "./PixelMapMarker";
import { StayMapMarker } from "./StayMapMarker";
import { RouteLayer } from "./RouteLayer";
import { RouteLabel } from "./RouteLabel";
import { MapPopup } from "./MapPopup";
import { MapControls } from "./MapControls";
import { MapDaySelector } from "./MapDaySelector";
import { MapPin } from "lucide-react";
import { midpoint, haversine, formatDistance } from "@/lib/geo";
import { useDistanceUnit } from "@/context/DistanceUnitContext";
import type { ItineraryBlock } from "@/types/itinerary";

import "mapbox-gl/dist/mapbox-gl.css";

interface RouteSegment {
  from: { lat: number; lng: number };
  to: { lat: number; lng: number };
  midpoint: [number, number];
  distance: number; // meters from Directions API (road distance)
}

interface ItineraryMapProps {
  blocks: ItineraryBlock[];
  activeBlockId: string | null;
  onBlockSelect: (blockId: string) => void;
  dayCount: number;
  activeDayIndex: number;
  onDaySelect: (index: number) => void;
  stayLat?: number | null;
  stayLng?: number | null;
  stayAddress?: string | null;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

export function ItineraryMap({
  blocks,
  activeBlockId,
  onBlockSelect,
  dayCount,
  activeDayIndex,
  onDaySelect,
  stayLat,
  stayLng,
  stayAddress,
}: ItineraryMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [popupBlockId, setPopupBlockId] = useState<string | null>(null);
  const [is3D, setIs3D] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const { unit } = useDistanceUnit();

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

  // Fetch real road distances from Mapbox Directions API
  const [routeSegments, setRouteSegments] = useState<RouteSegment[]>([]);

  useEffect(() => {
    if (mappableBlocks.length < 2) {
      setRouteSegments([]);
      return;
    }

    let cancelled = false;

    async function fetchDistances() {
      const segments: RouteSegment[] = [];

      const promises = [];
      for (let i = 0; i < mappableBlocks.length - 1; i++) {
        const from = mappableBlocks[i];
        const to = mappableBlocks[i + 1];
        const mid = midpoint(from.location_lat!, from.location_lng!, to.location_lat!, to.location_lng!);

        const fallbackDist = haversine(from.location_lat!, from.location_lng!, to.location_lat!, to.location_lng!);
        promises.push(
          fetch(
            `/api/directions?origin_lat=${from.location_lat}&origin_lng=${from.location_lng}&dest_lat=${to.location_lat}&dest_lng=${to.location_lng}&profile=driving`
          )
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => ({
              index: i,
              from: { lat: from.location_lat!, lng: from.location_lng! },
              to: { lat: to.location_lat!, lng: to.location_lng! },
              midpoint: mid,
              distance: data?.distance_meters ?? fallbackDist,
            }))
            .catch(() => ({
              index: i,
              from: { lat: from.location_lat!, lng: from.location_lng! },
              to: { lat: to.location_lat!, lng: to.location_lng! },
              midpoint: mid,
              distance: fallbackDist,
            }))
        );
      }

      const results = await Promise.all(promises);
      if (cancelled) return;

      // Sort by original index
      results.sort((a, b) => a.index - b.index);
      for (const r of results) {
        segments.push({
          from: r.from,
          to: r.to,
          midpoint: r.midpoint,
          distance: r.distance,
        });
      }
      setRouteSegments(segments);
    }

    fetchDistances();
    return () => { cancelled = true; };
  }, [mappableBlocks]);

  const [zoom, setZoom] = useState(12);

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
    if (stayLat && stayLng) {
      lngs.push(stayLng);
      lats.push(stayLat);
    }

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
  }, [mappableBlocks, is3D, stayLat, stayLng]);

  // Resize map when container dimensions change (divider drag, window resize, sidebar toggle)
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || !mapLoaded) return;
    const container = map.getContainer();
    const observer = new ResizeObserver(() => map.resize());
    observer.observe(container);
    return () => observer.disconnect();
  }, [mapLoaded]);

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
        <MapGL
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

  // Build marker data: assign indices and group co-located blocks
  const markerData = useMemo(() => {
    // Assign sequential index to each mappable block
    const indexed = mappableBlocks.map((block, i) => ({
      block,
      index: i + 1,
    }));

    // Group by coordinate key (rounded to ~11m precision to catch same-location blocks)
    const coordKey = (lat: number, lng: number) =>
      `${lat.toFixed(4)},${lng.toFixed(4)}`;

    const groups = new Map<string, typeof indexed>();
    for (const item of indexed) {
      const key = coordKey(item.block.location_lat!, item.block.location_lng!);
      const existing = groups.get(key);
      if (existing) {
        existing.push(item);
      } else {
        groups.set(key, [item]);
      }
    }

    // For each group, render only the first block's marker but with all indices
    const markers: { block: ItineraryBlock; index: number; additionalIndices: number[]; key: string }[] = [];
    const rendered = new Set<string>();

    for (const item of indexed) {
      const key = coordKey(item.block.location_lat!, item.block.location_lng!);
      if (rendered.has(key)) continue;
      rendered.add(key);

      const group = groups.get(key)!;
      const primary = group[0];
      const additional = group.slice(1).map((g) => g.index);

      markers.push({
        block: primary.block,
        index: primary.index,
        additionalIndices: additional,
        key: key,
      });
    }

    return markers;
  }, [mappableBlocks]);

  return (
    <div className="relative w-full h-full">
      <MapGL
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
        onZoom={(e) => setZoom(e.viewState.zoom)}
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

        <RouteLayer blocks={mappableBlocks} stayCoords={stayLat && stayLng ? [stayLng, stayLat] : undefined} />

        {markerData.map((m) => (
          <PixelMapMarker
            key={m.key}
            block={m.block}
            index={m.index}
            additionalIndices={m.additionalIndices}
            isActive={m.block.id === activeBlockId || m.block.id === popupBlockId}
            onClick={handleMarkerClick}
          />
        ))}

        {/* Stay marker */}
        {stayLat && stayLng && stayAddress && (
          <StayMapMarker
            lat={stayLat}
            lng={stayLng}
            address={stayAddress}
          />
        )}

        {/* Route labels at segment midpoints */}
        {zoom >= 11 && routeSegments.map((seg, i) => (
          seg.distance > 0 && (
            <RouteLabel
              key={`route-label-${i}`}
              longitude={seg.midpoint[0]}
              latitude={seg.midpoint[1]}
              distance={formatDistance(seg.distance, unit)}
            />
          )
        ))}

        {popupBlock && (
          <MapPopup block={popupBlock} onClose={() => setPopupBlockId(null)} />
        )}
      </MapGL>

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
