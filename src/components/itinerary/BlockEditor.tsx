"use client";

import { useState, useCallback } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  GripVertical,
  Trash2,
  Clock,
  MapPin,
  DollarSign,
  ChevronDown,
  ChevronUp,
  MapPinned,
  Utensils,
  Bus,
  Hotel,
  StickyNote,
  Heading,
  Sparkles,
} from "lucide-react";
import type { ItineraryBlock, UpdateBlockInput } from "@/types/itinerary";

interface BlockEditorProps {
  block: ItineraryBlock;
  onUpdate: (id: string, input: UpdateBlockInput) => void;
  onDelete: (id: string) => void;
}

const typeConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  activity: { icon: MapPinned, color: "bg-jam text-white", label: "Activity" },
  food: { icon: Utensils, color: "bg-grass text-night", label: "Food" },
  transport: { icon: Bus, color: "bg-sky text-night", label: "Transport" },
  accommodation: { icon: Hotel, color: "bg-moss text-white", label: "Stay" },
  note: { icon: StickyNote, color: "bg-mist text-night", label: "Note" },
  heading: { icon: Heading, color: "bg-night text-white", label: "Heading" },
};

export function BlockEditor({ block, onUpdate, onDelete }: BlockEditorProps) {
  const [expanded, setExpanded] = useState(false);
  const config = typeConfig[block.type] || typeConfig.activity;
  const Icon = config.icon;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleFieldChange = useCallback(
    (field: keyof UpdateBlockInput, value: string | number | null) => {
      onUpdate(block.id, { [field]: value || null });
    },
    [block.id, onUpdate]
  );

  if (block.type === "heading") {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "flex items-center gap-2 p-3 bg-night/5 border-[3px] border-night/20",
          isDragging && "opacity-50"
        )}
      >
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-0.5">
          <GripVertical className="w-4 h-4 text-rock" />
        </button>
        <Heading className="w-4 h-4 text-night" />
        <input
          type="text"
          value={block.title}
          onChange={(e) => handleFieldChange("title", e.target.value)}
          className="flex-1 bg-transparent font-[family-name:var(--font-silkscreen)] text-sm text-night uppercase outline-none"
          placeholder="Section heading..."
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(block.id)}
          className="h-6 w-6 text-rock hover:text-destructive"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "border-[3px] border-night/20 bg-white transition-colors",
        isDragging && "opacity-50 border-jam",
        expanded && "border-night"
      )}
    >
      {/* Compact view */}
      <div className="flex items-center gap-2 p-2">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-0.5">
          <GripVertical className="w-4 h-4 text-rock" />
        </button>

        <Badge className={cn("text-[9px] shrink-0", config.color)}>
          <Icon className="w-3 h-3 mr-1" />
          {config.label}
        </Badge>

        <input
          type="text"
          value={block.title}
          onChange={(e) => handleFieldChange("title", e.target.value)}
          className="flex-1 text-sm text-night bg-transparent outline-none min-w-0"
          placeholder="Block title..."
        />

        {block.ai_generated && (
          <Sparkles className="w-3.5 h-3.5 text-jam shrink-0" />
        )}

        {block.start_time && (
          <span className="text-[10px] text-rock shrink-0 hidden sm:inline">
            {block.start_time}
          </span>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="p-0.5 text-rock hover:text-night"
        >
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(block.id)}
          className="h-6 w-6 text-rock hover:text-destructive"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t-[2px] border-night/10 space-y-3">
          <div>
            <label className="text-[10px] font-[family-name:var(--font-silkscreen)] uppercase text-rock">
              Description
            </label>
            <Textarea
              value={block.description || ""}
              onChange={(e) => handleFieldChange("description", e.target.value)}
              placeholder="Details about this block..."
              rows={2}
              className="mt-1 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="flex items-center gap-1 text-[10px] font-[family-name:var(--font-silkscreen)] uppercase text-rock">
                <Clock className="w-3 h-3" /> Start
              </label>
              <Input
                type="time"
                value={block.start_time || ""}
                onChange={(e) => handleFieldChange("start_time", e.target.value)}
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <label className="flex items-center gap-1 text-[10px] font-[family-name:var(--font-silkscreen)] uppercase text-rock">
                <Clock className="w-3 h-3" /> End
              </label>
              <Input
                type="time"
                value={block.end_time || ""}
                onChange={(e) => handleFieldChange("end_time", e.target.value)}
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <label className="flex items-center gap-1 text-[10px] font-[family-name:var(--font-silkscreen)] uppercase text-rock">
                <DollarSign className="w-3 h-3" /> Cost
              </label>
              <Input
                type="number"
                value={block.cost_estimate ?? ""}
                onChange={(e) =>
                  handleFieldChange(
                    "cost_estimate",
                    e.target.value ? Number(e.target.value) : null
                  )
                }
                placeholder="0"
                className="mt-1 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1 text-[10px] font-[family-name:var(--font-silkscreen)] uppercase text-rock">
              <MapPin className="w-3 h-3" /> Location
            </label>
            <Input
              value={block.location || ""}
              onChange={(e) => handleFieldChange("location", e.target.value)}
              placeholder="Where is this?"
              className="mt-1 text-xs"
            />
          </div>
        </div>
      )}
    </div>
  );
}
