"use client";

import { useCallback } from "react";
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
import { DaySection } from "./DaySection";
import { PixelWindow } from "@/components/pixel/PixelWindow";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Sparkles, PenTool } from "lucide-react";
import Link from "next/link";
import type { CreateBlockInput, UpdateBlockInput } from "@/types/itinerary";

interface ItineraryEditorProps {
  tripId: string;
}

export function ItineraryEditor({ tripId }: ItineraryEditorProps) {
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
  } = useItinerary(tripId);

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

      // Find which day contains the active and over blocks
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

      // Reorder within same day
      const newDays = [...days];
      const day = { ...newDays[sourceDayIdx] };
      const blocks = [...day.blocks];
      const [moved] = blocks.splice(sourceBlockIdx, 1);
      blocks.splice(destBlockIdx, 0, moved);
      day.blocks = blocks;
      newDays[sourceDayIdx] = day;
      setDays(newDays);

      // Send reorder to API
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

  if (loading) {
    return (
      <div className="p-6 space-y-4 max-w-3xl mx-auto">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    );
  }

  if (days.length === 0) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
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
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-base">Your Itinerary</h2>
        <span className="text-xs text-rock font-[family-name:var(--font-silkscreen)]">
          {days.length} day{days.length !== 1 ? "s" : ""} &bull;{" "}
          {days.reduce((sum, d) => sum + d.blocks.length, 0)} blocks
        </span>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        {days.map((day) => (
          <DaySection
            key={day.id}
            day={day}
            onUpdateDay={updateDay}
            onUpdateBlock={handleUpdateBlock}
            onDeleteBlock={handleDeleteBlock}
            onAddBlock={handleAddBlock}
            onDeleteDay={handleDeleteDay}
          />
        ))}
      </DndContext>
    </div>
  );
}
