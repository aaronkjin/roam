"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
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
  isActive?: boolean;
  onHover?: ((blockId: string | null) => void) | undefined;
  /** Map pin number (only set for blocks that appear on the map) */
  mapIndex?: number;
  canEdit?: boolean;
}

const typeConfig: Record<string, { icon: React.ElementType; color: string; label: string; fallbackBg: string }> = {
  activity: { icon: MapPinned, color: "bg-jam text-white", label: "Activity", fallbackBg: "bg-jam/10" },
  food: { icon: Utensils, color: "bg-grass text-night", label: "Food", fallbackBg: "bg-grass/10" },
  transport: { icon: Bus, color: "bg-sky text-night", label: "Transport", fallbackBg: "bg-sky/20" },
  accommodation: { icon: Hotel, color: "bg-moss text-white", label: "Stay", fallbackBg: "bg-moss/10" },
  note: { icon: StickyNote, color: "bg-mist text-night", label: "Note", fallbackBg: "bg-mist" },
  heading: { icon: Heading, color: "bg-night text-white", label: "Heading", fallbackBg: "bg-night/5" },
};

function buildMapsUrl(block: ItineraryBlock): string | null {
  if (!block.location) return null;
  if (block.location_lat && block.location_lng) {
    return `https://maps.google.com/?q=${block.location_lat},${block.location_lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(block.location)}`;
}

export function BlockEditor({ block, onUpdate, onDelete, isActive, onHover, mapIndex, canEdit = true }: BlockEditorProps) {
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
        id={`block-${block.id}`}
        ref={setNodeRef}
        style={style}
        className={cn(
          "flex items-center gap-2 p-3 bg-night/5 border-[3px] border-night/20",
          isDragging && "opacity-50"
        )}
        onMouseEnter={() => onHover?.(block.id)}
        onMouseLeave={() => onHover?.(null)}
      >
        {canEdit && (
          <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-0.5">
            <GripVertical className="w-4 h-4 text-rock" />
          </button>
        )}
        <Heading className="w-4 h-4 text-night" />
        <input
          type="text"
          value={block.title}
          onChange={(e) => handleFieldChange("title", e.target.value)}
          className="flex-1 bg-transparent font-[family-name:var(--font-silkscreen)] text-sm text-night uppercase outline-none"
          placeholder="Section heading..."
          readOnly={!canEdit}
        />
        {canEdit && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(block.id)}
            className="h-6 w-6 text-rock hover:text-destructive"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    );
  }

  // Transport block: sky banner with icon, no photo
  if (block.type === "transport") {
    const mapsUrl = buildMapsUrl(block);
    return (
      <div
        id={`block-${block.id}`}
        ref={setNodeRef}
        style={style}
        className={cn(
          "border-[3px] border-night/20 bg-white transition-colors",
          isDragging && "opacity-50 border-jam",
          expanded && "border-night",
          isActive && "border-jam bg-jam/5"
        )}
        onMouseEnter={() => onHover?.(block.id)}
        onMouseLeave={() => onHover?.(null)}
      >
        {/* Transport header bar */}
        <div className="flex items-center gap-2 px-3 py-2 bg-sky/20 border-b-[2px] border-sky/40">
          {canEdit && (
            <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-0.5">
              <GripVertical className="w-4 h-4 text-rock" />
            </button>
          )}
          <Bus className="w-4 h-4 text-night shrink-0" />
          <Badge className="text-[9px] bg-sky text-night shrink-0">Transport</Badge>
          {block.duration_minutes != null && (
            <span className="text-[10px] font-[family-name:var(--font-silkscreen)] text-rock">
              ~{block.duration_minutes} min
            </span>
          )}
          {block.cost_estimate != null && block.cost_estimate > 0 && (
            <span className="text-[10px] font-[family-name:var(--font-silkscreen)] text-rock border-[2px] border-rock/30 px-1.5 py-0.5">
              {block.currency !== "USD" ? block.currency : "$"}{block.cost_estimate}
            </span>
          )}
          <div className="flex-1" />
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-0.5 text-rock hover:text-night"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {canEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(block.id)}
              className="h-6 w-6 text-rock hover:text-destructive"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>

        {/* Transport body */}
        <div className="p-3 space-y-1.5">
          <input
            type="text"
            value={block.title}
            onChange={(e) => handleFieldChange("title", e.target.value)}
            className="w-full text-sm font-medium text-night bg-transparent outline-none"
            placeholder="Transport description..."
            readOnly={!canEdit}
          />
          {block.description && (
            <p className="text-xs text-rock leading-relaxed">{block.description}</p>
          )}
          <div className="flex items-center gap-2 pt-1">
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] font-[family-name:var(--font-silkscreen)] text-sky border-[2px] border-sky px-1.5 py-0.5 hover:bg-sky hover:text-night transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <MapPin className="w-3 h-3" /> Maps
              </a>
            )}
          </div>
        </div>

        {/* Expanded edit fields */}
        {expanded && (
          <div className="px-3 pb-3 pt-1 border-t-[2px] border-night/10 space-y-3">
            <div>
              <label className="text-[10px] font-[family-name:var(--font-silkscreen)] uppercase text-rock">
                Description
              </label>
              <Textarea
                value={block.description || ""}
                onChange={(e) => handleFieldChange("description", e.target.value)}
                placeholder="Step-by-step instructions..."
                rows={3}
                className="mt-1 text-xs"
                readOnly={!canEdit}
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
                  readOnly={!canEdit}
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
                  readOnly={!canEdit}
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
                    handleFieldChange("cost_estimate", e.target.value ? Number(e.target.value) : null)
                  }
                  placeholder="0"
                  className="mt-1 text-xs"
                  readOnly={!canEdit}
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
                placeholder="Where does this go?"
                className="mt-1 text-xs"
                readOnly={!canEdit}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // All other block types: photo banner card
  const mapsUrl = buildMapsUrl(block);

  return (
    <div
      id={`block-${block.id}`}
      ref={setNodeRef}
      style={style}
      className={cn(
        "border-[3px] border-night/20 bg-white transition-colors overflow-hidden",
        isDragging && "opacity-50 border-jam",
        expanded && "border-night",
        isActive && "border-jam bg-jam/5"
      )}
      onMouseEnter={() => onHover?.(block.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      {/* Photo banner */}
      <div className="relative w-full" style={{ aspectRatio: "16/7" }}>
        {block.image_url ? (
          <Image
            src={block.image_url}
            alt={block.title}
            fill
            className="object-cover"
            sizes="(max-width:768px) 100vw, 600px"
            unoptimized
          />
        ) : (
          <div className={cn("w-full h-full", config.fallbackBg)} />
        )}
        {/* Drag handle overlay top-left */}
        {canEdit && (
          <button
            {...attributes}
            {...listeners}
            className="absolute top-1.5 left-1.5 cursor-grab active:cursor-grabbing bg-white/80 p-0.5 border-[2px] border-night/20"
          >
            <GripVertical className="w-4 h-4 text-night" />
          </button>
        )}
        {/* AI badge top-right (only when there's a photo) */}
        {block.ai_generated && block.image_url && (
          <div className="absolute top-1.5 right-1.5 bg-white/80 border-[2px] border-night/20 px-1.5 py-0.5">
            <Sparkles className="w-3 h-3 text-jam inline" />
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-3 space-y-2">
        {/* Type badge + time + map pin */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={cn("text-[9px] shrink-0", config.color)}>
            <Icon className="w-3 h-3 mr-1" />
            {config.label}
          </Badge>
          {block.start_time && (
            <span className="text-[10px] font-[family-name:var(--font-silkscreen)] text-rock">
              {block.start_time}{block.end_time ? `–${block.end_time}` : ""}
            </span>
          )}
          {mapIndex != null && (
            <div
              className={cn(
                "flex items-center justify-center w-5 h-5 border-[2px] border-night shrink-0 font-[family-name:var(--font-silkscreen)] text-[9px] font-bold leading-none",
                config.color
              )}
            >
              {mapIndex}
            </div>
          )}
        </div>

        {/* Editable title */}
        <input
          type="text"
          value={block.title}
          onChange={(e) => handleFieldChange("title", e.target.value)}
          className="w-full text-sm font-medium text-night bg-transparent outline-none"
          placeholder="Block title..."
          readOnly={!canEdit}
        />

        {/* Description preview (line-clamped) */}
        {block.description && !expanded && (
          <p className="text-xs text-rock line-clamp-3 leading-relaxed">{block.description}</p>
        )}

        {/* Footer: Maps + cost + expand + delete */}
        <div className="flex items-center gap-2 pt-0.5">
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] font-[family-name:var(--font-silkscreen)] text-sky border-[2px] border-sky px-1.5 py-0.5 hover:bg-sky hover:text-night transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <MapPin className="w-3 h-3" /> Maps
            </a>
          )}
          {block.cost_estimate != null && block.cost_estimate > 0 && (
            <span className="text-[10px] font-[family-name:var(--font-silkscreen)] text-rock border-[2px] border-rock/30 px-1.5 py-0.5">
              {block.currency !== "USD" ? block.currency : "$"}{block.cost_estimate}
            </span>
          )}
          <div className="flex-1" />
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-0.5 text-rock hover:text-night"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {canEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(block.id)}
              className="h-6 w-6 text-rock hover:text-destructive"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Expanded edit panel */}
      {expanded && (
        <div className="px-3 pb-3 border-t-[2px] border-night/10 space-y-3 pt-3">
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
              readOnly={!canEdit}
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
                readOnly={!canEdit}
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
                readOnly={!canEdit}
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
                readOnly={!canEdit}
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
              readOnly={!canEdit}
            />
          </div>
        </div>
      )}
    </div>
  );
}
