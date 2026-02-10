"use client";

import { useCallback } from "react";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { BlockEditor } from "./BlockEditor";
import { BlockToolbar } from "./BlockToolbar";
import { PixelWindow } from "@/components/pixel/PixelWindow";
import { Separator } from "@/components/ui/separator";
import type { ItineraryDay, ItineraryBlock, BlockType, UpdateBlockInput, CreateBlockInput } from "@/types/itinerary";

interface DaySectionProps {
  day: ItineraryDay & { blocks: ItineraryBlock[] };
  onUpdateDay: (dayId: string, input: { title?: string; summary?: string }) => void;
  onUpdateBlock: (blockId: string, input: UpdateBlockInput) => void;
  onDeleteBlock: (blockId: string) => void;
  onAddBlock: (input: CreateBlockInput) => void;
  onDeleteDay: (dayId: string) => void;
}

export function DaySection({
  day,
  onUpdateDay,
  onUpdateBlock,
  onDeleteBlock,
  onAddBlock,
  onDeleteDay,
}: DaySectionProps) {
  const handleAddBlock = useCallback(
    (type: BlockType) => {
      onAddBlock({
        day_id: day.id,
        type,
        title: type === "heading" ? "New Section" : "New Block",
      });
    },
    [day.id, onAddBlock]
  );

  return (
    <PixelWindow
      title={`Day ${day.day_number}${day.title ? ` — ${day.title}` : ""}`}
      variant="mist"
      onClose={() => onDeleteDay(day.id)}
    >
      <div className="space-y-3">
        {/* Day header - editable */}
        <div className="space-y-2">
          <input
            type="text"
            value={day.title || ""}
            onChange={(e) => onUpdateDay(day.id, { title: e.target.value })}
            className="w-full bg-transparent text-sm font-bold text-night outline-none"
            placeholder="Day title..."
          />
          <input
            type="text"
            value={day.summary || ""}
            onChange={(e) => onUpdateDay(day.id, { summary: e.target.value })}
            className="w-full bg-transparent text-xs text-rock outline-none"
            placeholder="Brief summary of the day..."
          />
        </div>

        <Separator />

        {/* Blocks */}
        <SortableContext
          items={day.blocks.map((b) => b.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {day.blocks.map((block) => (
              <BlockEditor
                key={block.id}
                block={block}
                onUpdate={onUpdateBlock}
                onDelete={onDeleteBlock}
              />
            ))}
          </div>
        </SortableContext>

        {/* Add block */}
        <div className="flex justify-center pt-2">
          <BlockToolbar onAddBlock={handleAddBlock} />
        </div>
      </div>
    </PixelWindow>
  );
}
