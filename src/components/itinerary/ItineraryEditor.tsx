"use client";

import { useCallback, useRef, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { useItinerary } from "@/hooks/useItinerary";
import { useBlockAIEdit } from "@/hooks/useBlockAIEdit";
import { useTrips } from "@/context/TripsContext";
import { DaySection } from "./DaySection";
import { InlineAIEdit } from "./InlineAIEdit";
import { BlockDiffPreview } from "./BlockDiffPreview";
import { ShareMenu } from "./ShareMenu";
import { PixelWindow } from "@/components/pixel/PixelWindow";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Sparkles, PenTool } from "lucide-react";
import Link from "next/link";
import type { CreateBlockInput, UpdateBlockInput, ItineraryBlock } from "@/types/itinerary";

type ItineraryHookReturn = ReturnType<typeof useItinerary>;

interface ItineraryEditorProps {
  tripId: string;
  /** When provided, editor uses external itinerary state (from ItineraryMapLayout) */
  itinerary?: ItineraryHookReturn;
  activeDayIndex?: number;
  onDayClick?: (dayIndex: number) => void;
  activeBlockId?: string | null;
  onBlockHover?: (blockId: string | null) => void;
}

export function ItineraryEditor({
  tripId,
  itinerary: externalItinerary,
  activeDayIndex,
  onDayClick,
  activeBlockId,
  onBlockHover,
}: ItineraryEditorProps) {
  const internalItinerary = useItinerary(externalItinerary ? "" : tripId);
  const {
    days,
    loading,
    addBlock,
    updateBlock,
    deleteBlock,
    reorderBlocks,
    deleteDay,
    updateDay,
    setDays,
  } = externalItinerary || internalItinerary;
  const { trips } = useTrips();
  const trip = trips.find((t) => t.id === tripId);
  const userRole = trip && "userRole" in trip ? (trip as import("@/types/trip").TripWithRole).userRole : "owner";
  const canEdit = userRole === "owner";
  const itineraryRef = useRef<HTMLDivElement>(null);

  // AI edit hook
  const aiEdit = useBlockAIEdit(tripId);

  // Cmd+K keyboard shortcut for AI edit
  useEffect(() => {
    if (!canEdit) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (aiEdit.isSelectMode && aiEdit.selectedBlockIds.size > 0) {
          // Already in select mode with blocks selected — focus is on the input
          return;
        }
        if (aiEdit.isSelectMode) {
          aiEdit.clearSelection();
        } else {
          aiEdit.enterSelectMode();
        }
      }
      if (e.key === "Escape" && aiEdit.isSelectMode) {
        aiEdit.clearSelection();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [canEdit, aiEdit]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      let sourceDayIdx = -1;
      let sourceBlockIdx = -1;
      let destBlockIdx = -1;

      for (let d = 0; d < days.length; d++) {
        const aIdx = days[d].blocks.findIndex((b) => b.id === active.id);
        if (aIdx !== -1) {
          sourceDayIdx = d;
          sourceBlockIdx = aIdx;
        }
        const oIdx = days[d].blocks.findIndex((b) => b.id === over.id);
        if (oIdx !== -1) {
          destBlockIdx = oIdx;
        }
      }

      if (sourceDayIdx === -1 || sourceBlockIdx === -1) return;

      const newDays = [...days];
      const day = { ...newDays[sourceDayIdx] };
      const blocks = [...day.blocks];
      const [moved] = blocks.splice(sourceBlockIdx, 1);
      blocks.splice(destBlockIdx, 0, moved);
      day.blocks = blocks;
      newDays[sourceDayIdx] = day;
      setDays(newDays);

      const updates = blocks.map((b, i) => ({
        id: b.id,
        position_index: i,
        day_id: day.id,
      }));
      reorderBlocks(updates);
    },
    [days, setDays, reorderBlocks]
  );

  const handleAddBlock = useCallback(
    (input: CreateBlockInput) => {
      addBlock(input);
    },
    [addBlock]
  );

  const handleUpdateBlock = useCallback(
    (blockId: string, input: UpdateBlockInput) => {
      updateBlock(blockId, input);
    },
    [updateBlock]
  );

  const handleDeleteBlock = useCallback(
    (blockId: string) => {
      deleteBlock(blockId);
    },
    [deleteBlock]
  );

  const handleDeleteDay = useCallback(
    (dayId: string) => {
      deleteDay(dayId);
    },
    [deleteDay]
  );

  // AI edit handlers
  const handleAISubmit = useCallback(
    (instruction: string) => {
      // Gather context blocks (2 before and 2 after selection within same day)
      const allBlocks = days.flatMap((d) => d.blocks);
      const selectedIds = aiEdit.selectedBlockIds;
      const contextBlocks: ItineraryBlock[] = [];

      for (const day of days) {
        const selectedInDay = day.blocks.filter((b) => selectedIds.has(b.id));
        if (selectedInDay.length === 0) continue;

        const firstIdx = day.blocks.findIndex((b) => selectedIds.has(b.id));
        const lastIdx = day.blocks.length - 1 - [...day.blocks].reverse().findIndex((b) => selectedIds.has(b.id));

        for (let i = Math.max(0, firstIdx - 2); i < firstIdx; i++) {
          if (!selectedIds.has(day.blocks[i].id)) {
            contextBlocks.push(day.blocks[i]);
          }
        }
        for (let i = lastIdx + 1; i <= Math.min(day.blocks.length - 1, lastIdx + 2); i++) {
          if (!selectedIds.has(day.blocks[i].id)) {
            contextBlocks.push(day.blocks[i]);
          }
        }
      }

      aiEdit.submitEdit(instruction, contextBlocks);
    },
    [days, aiEdit]
  );

  const handleAcceptSuggestion = useCallback(
    (blockId: string, suggestion: import("@/hooks/useBlockAIEdit").BlockEditSuggestion) => {
      const updates: UpdateBlockInput = {};
      if (suggestion.title) updates.title = suggestion.title;
      if (suggestion.description) updates.description = suggestion.description;
      if (suggestion.start_time) updates.start_time = suggestion.start_time;
      if (suggestion.end_time) updates.end_time = suggestion.end_time;
      if (suggestion.duration_minutes) updates.duration_minutes = suggestion.duration_minutes;
      if (suggestion.location) updates.location = suggestion.location;
      if (suggestion.location_lat) updates.location_lat = suggestion.location_lat;
      if (suggestion.location_lng) updates.location_lng = suggestion.location_lng;
      if (suggestion.cost_estimate !== undefined) updates.cost_estimate = suggestion.cost_estimate;
      updateBlock(blockId, updates);
      aiEdit.acceptSuggestion(blockId);
    },
    [updateBlock, aiEdit]
  );

  const handleAcceptAll = useCallback(() => {
    const accepted = aiEdit.acceptAll();
    for (const suggestion of accepted) {
      const updates: UpdateBlockInput = {};
      if (suggestion.title) updates.title = suggestion.title;
      if (suggestion.description) updates.description = suggestion.description;
      if (suggestion.start_time) updates.start_time = suggestion.start_time;
      if (suggestion.end_time) updates.end_time = suggestion.end_time;
      if (suggestion.duration_minutes) updates.duration_minutes = suggestion.duration_minutes;
      if (suggestion.location) updates.location = suggestion.location;
      if (suggestion.location_lat) updates.location_lat = suggestion.location_lat;
      if (suggestion.location_lng) updates.location_lng = suggestion.location_lng;
      if (suggestion.cost_estimate !== undefined) updates.cost_estimate = suggestion.cost_estimate;
      updateBlock(suggestion.id, updates);
    }
    aiEdit.clearSelection();
  }, [updateBlock, aiEdit]);

  // Get original blocks for diff preview
  const selectedOriginalBlocks = days
    .flatMap((d) => d.blocks)
    .filter((b) => aiEdit.selectedBlockIds.has(b.id));

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    );
  }

  if (days.length === 0) {
    return (
      <div className="p-6">
        <PixelWindow title="No Itinerary Yet" variant="moss">
          <div className="text-center py-8 space-y-4">
            <PenTool className="w-12 h-12 text-moss mx-auto" />
            <p className="font-[family-name:var(--font-press-start)] text-sm text-night">
              Nothing here yet!
            </p>
            <p className="text-sm text-rock max-w-md mx-auto">
              Generate an itinerary from your inspo, or it will appear here once you do.
            </p>
            <Button asChild>
              <Link href={`/trip/${tripId}/generate`}>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Itinerary
              </Link>
            </Button>
          </div>
        </PixelWindow>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base">Your Itinerary</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-rock font-[family-name:var(--font-silkscreen)]">
            {days.length} day{days.length !== 1 ? "s" : ""} &bull;{" "}
            {days.reduce((sum, d) => sum + d.blocks.length, 0)} blocks
          </span>
          {canEdit && !aiEdit.isSelectMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => aiEdit.enterSelectMode()}
              title="Select blocks for AI edit (Cmd+K)"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              AI Edit
            </Button>
          )}
          <ShareMenu
            tripId={tripId}
            tripTitle={trip?.title || "My Trip"}
            tripDestination={trip?.destination}
            startDate={trip?.start_date}
            endDate={trip?.end_date}
            dateRangeLabel={trip?.date_range_label}
            days={days}
            itineraryRef={itineraryRef}
            userRole={trip && "userRole" in trip ? (trip as import("@/types/trip").TripWithRole).userRole : "owner"}
          />
        </div>
      </div>

      {/* AI edit diff preview */}
      {aiEdit.suggestions.length > 0 && (
        <BlockDiffPreview
          originalBlocks={selectedOriginalBlocks}
          suggestions={aiEdit.suggestions}
          onAccept={handleAcceptSuggestion}
          onReject={(blockId) => aiEdit.rejectSuggestion(blockId)}
          onAcceptAll={handleAcceptAll}
          onRejectAll={() => { aiEdit.rejectAll(); aiEdit.clearSelection(); }}
        />
      )}

      <div ref={itineraryRef}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-6">
            {days.map((day, dayIndex) => (
              <DaySection
                key={day.id}
                day={day}
                onUpdateDay={updateDay}
                onUpdateBlock={handleUpdateBlock}
                onDeleteBlock={handleDeleteBlock}
                onAddBlock={handleAddBlock}
                onDeleteDay={handleDeleteDay}
                isActive={activeDayIndex === dayIndex}
                onClick={() => onDayClick?.(dayIndex)}
                activeBlockId={activeBlockId ?? null}
                onBlockHover={onBlockHover}
                canEdit={canEdit}
                isSelectMode={aiEdit.isSelectMode}
                selectedBlockIds={aiEdit.selectedBlockIds}
                onToggleBlockSelect={aiEdit.toggleBlockSelection}
              />
            ))}
          </div>
        </DndContext>
      </div>

      {/* Inline AI edit prompt */}
      {aiEdit.isSelectMode && aiEdit.suggestions.length === 0 && (
        <InlineAIEdit
          selectedCount={aiEdit.selectedBlockIds.size}
          loading={aiEdit.loading}
          error={aiEdit.error}
          onSubmit={handleAISubmit}
          onCancel={() => aiEdit.clearSelection()}
        />
      )}
    </div>
  );
}
