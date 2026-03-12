"use client";

import { useCallback, useMemo } from "react";
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
  isActive?: boolean;
  onClick?: () => void;
  activeBlockId?: string | null;
  onBlockHover?: ((blockId: string | null) => void) | undefined;
  canEdit?: boolean;
  /** AI edit selection */
  isSelectMode?: boolean;
  selectedBlockIds?: Set<string>;
  onToggleBlockSelect?: (blockId: string) => void;
}

export function DaySection({
  day,
  onUpdateDay,
  onUpdateBlock,
  onDeleteBlock,
  onAddBlock,
  onDeleteDay,
  isActive,
  onClick,
  activeBlockId,
  onBlockHover,
  canEdit = true,
  isSelectMode = false,
  selectedBlockIds,
  onToggleBlockSelect,
}: DaySectionProps) {
  const visibleBlocks = useMemo(() => day.blocks, [day.blocks]);

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
    <div id={`day-${day.id}`} onClick={onClick} className="cursor-pointer">
      <PixelWindow
        title={`Day ${day.day_number}${day.title ? ` — ${day.title.replace(/^Day\s*\d+\s*[-–—:]\s*/i, "")}` : ""}`}
        variant={isActive ? "jam" : "mist"}
        onClose={canEdit ? () => onDeleteDay(day.id) : undefined}
      >
        <div className="space-y-3">
          {/* Day header - editable */}
          <div className="space-y-2">
            <input
              type="text"
              value={(day.title || "").replace(/^Day\s*\d+\s*[-–—:]\s*/i, "")}
              onChange={(e) => onUpdateDay(day.id, { title: e.target.value })}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-transparent text-sm font-bold text-night outline-none"
              placeholder="Day title..."
              readOnly={!canEdit}
            />
            <textarea
              value={day.summary || ""}
              onChange={(e) => onUpdateDay(day.id, { summary: e.target.value })}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-transparent text-xs text-rock outline-none resize-none leading-relaxed"
              placeholder="Brief summary of the day..."
              readOnly={!canEdit}
              rows={Math.max(1, Math.ceil((day.summary || "").length / 60))}
            />
          </div>

          <Separator />

          {/* Blocks */}
          <SortableContext
            items={visibleBlocks.map((b) => b.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {(() => {
                let pinIndex = 0;
                return visibleBlocks.map((block) => {
                  const isMappable =
                    block.location_lat &&
                    block.location_lng &&
                    block.type !== "heading" &&
                    block.type !== "note";
                  if (isMappable) pinIndex++;
                  return (
                    <BlockEditor
                      key={block.id}
                      block={block}
                      onUpdate={onUpdateBlock}
                      onDelete={onDeleteBlock}
                      isActive={activeBlockId === block.id}
                      onHover={onBlockHover}
                      mapIndex={isMappable ? pinIndex : undefined}
                      canEdit={canEdit}
                      isSelectMode={isSelectMode}
                      isSelected={selectedBlockIds?.has(block.id) ?? false}
                      onToggleSelect={() => onToggleBlockSelect?.(block.id)}
                    />
                  );
                });
              })()}
            </div>
          </SortableContext>

          {/* Add block */}
          {canEdit && (
            <div className="flex justify-center pt-2">
              <BlockToolbar onAddBlock={handleAddBlock} />
            </div>
          )}
        </div>
      </PixelWindow>
    </div>
  );
}
