"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { useItinerary } from "@/hooks/useItinerary";
import { useGeocoding } from "@/hooks/useGeocoding";
import { useTrips } from "@/context/TripsContext";
import { ItineraryEditor } from "./ItineraryEditor";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Map as MapIcon, GripVertical } from "lucide-react";

const ItineraryMap = dynamic(
  () =>
    import("@/components/map/ItineraryMap").then((mod) => mod.ItineraryMap),
  { ssr: false }
);

interface ItineraryMapLayoutProps {
  tripId: string;
}

export function ItineraryMapLayout({ tripId }: ItineraryMapLayoutProps) {
  const itinerary = useItinerary(tripId);
  const { days, updateBlock } = itinerary;
  const { trips } = useTrips();
  const trip = trips.find((t) => t.id === tripId);

  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [mobileMapOpen, setMobileMapOpen] = useState(false);
  const hoveredRef = useRef<string | null>(null);

  // Resizable split: leftPct is the itinerary panel width as a percentage
  const [leftPct, setLeftPct] = useState(50);
  const isDraggingDivider = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const onDividerPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    isDraggingDivider.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onDividerPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingDivider.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    setLeftPct(Math.min(Math.max(pct, 20), 80));
  }, []);

  const onDividerPointerUp = useCallback(() => {
    isDraggingDivider.current = false;
  }, []);

  // Prevent text selection while dragging
  useEffect(() => {
    const prevent = (e: Event) => { if (isDraggingDivider.current) e.preventDefault(); };
    document.addEventListener("selectstart", prevent);
    return () => document.removeEventListener("selectstart", prevent);
  }, []);

  // Get all blocks for geocoding — use stable memo
  const allBlocks = useMemo(
    () => days.flatMap((d) => d.blocks || []),
    [days]
  );
  useGeocoding({ blocks: allBlocks, updateBlock, destination: trip?.destination });

  const activeDay = days[activeDayIndex];
  const activeDayBlocks = activeDay?.blocks || [];

  const handleDaySelect = useCallback(
    (index: number) => {
      setActiveDayIndex(index);
      setActiveBlockId(null);
      hoveredRef.current = null;

      // Scroll the day section into view in the editor
      setTimeout(() => {
        const dayEl = document.getElementById(`day-${days[index]?.id}`);
        dayEl?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    },
    [days]
  );

  const handleBlockSelect = useCallback((blockId: string) => {
    setActiveBlockId(blockId);
    hoveredRef.current = blockId;

    // Scroll the block into view in the editor
    const blockEl = document.getElementById(`block-${blockId}`);
    blockEl?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const handleBlockHover = useCallback((blockId: string | null) => {
    // Prevent infinite re-render: only update state if value actually changed
    if (hoveredRef.current === blockId) return;
    hoveredRef.current = blockId;
    setActiveBlockId(blockId);
  }, []);

  const handleDayClick = useCallback((dayIndex: number) => {
    setActiveDayIndex(dayIndex);
    setActiveBlockId(null);
    hoveredRef.current = null;
  }, []);

  const mapProps = useMemo(
    () => ({
      blocks: activeDayBlocks,
      activeBlockId,
      onBlockSelect: handleBlockSelect,
      dayCount: days.length,
      activeDayIndex,
      onDaySelect: handleDaySelect,
      stayLat: trip?.stay_lat,
      stayLng: trip?.stay_lng,
      stayAddress: trip?.stay_address,
    }),
    [activeDayBlocks, activeBlockId, handleBlockSelect, days.length, activeDayIndex, handleDaySelect, trip?.stay_lat, trip?.stay_lng, trip?.stay_address]
  );

  return (
    <div
      ref={containerRef}
      className="flex h-full"
      onPointerMove={onDividerPointerMove}
      onPointerUp={onDividerPointerUp}
    >
      {/* Left: Itinerary Editor */}
      <div
        className="overflow-y-auto lg:block"
        style={{ width: `${leftPct}%`, minWidth: 0 }}
      >
        <ItineraryEditor
          tripId={tripId}
          itinerary={itinerary}
          activeDayIndex={activeDayIndex}
          onDayClick={handleDayClick}
          activeBlockId={activeBlockId}
          onBlockHover={handleBlockHover}
        />
      </div>

      {/* Draggable divider (desktop only) */}
      <div
        onPointerDown={onDividerPointerDown}
        className="hidden lg:flex items-center justify-center w-3 shrink-0 border-x-[3px] border-night bg-milk hover:bg-mist cursor-col-resize z-10 group"
        title="Drag to resize"
      >
        <GripVertical className="w-3 h-3 text-rock group-hover:text-night" />
      </div>

      {/* Right: Map (desktop) */}
      <div
        className="hidden lg:block relative"
        style={{ width: `${100 - leftPct}%`, minWidth: 0 }}
      >
        {days.length > 0 && <ItineraryMap {...mapProps} />}
      </div>

      {/* Mobile: floating map button */}
      {days.length > 0 && (
        <button
          onClick={() => setMobileMapOpen(true)}
          className="fixed bottom-6 right-6 z-50 lg:hidden w-14 h-14 bg-jam text-white border-[3px] border-night pixel-shadow flex items-center justify-center"
        >
          <MapIcon className="w-6 h-6" />
        </button>
      )}

      {/* Mobile: map sheet */}
      <Sheet open={mobileMapOpen} onOpenChange={setMobileMapOpen}>
        <SheetContent side="bottom" className="h-[70vh] p-0">
          <div className="w-full h-full">
            {days.length > 0 && <ItineraryMap {...mapProps} />}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
