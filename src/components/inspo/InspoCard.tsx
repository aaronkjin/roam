"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, ExternalLink, Trash2, Edit2, StickyNote, Link, Image, Video, FileText, GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { InspoItem } from "@/types/inspo";

interface InspoCardProps {
  item: InspoItem;
  onEdit: (item: InspoItem) => void;
  onDelete: (id: string) => void;
}

const typeIcons = {
  link: Link,
  image: Image,
  video: Video,
  article: FileText,
  note: StickyNote,
};

const typeColors = {
  link: "bg-sky",
  image: "bg-grass",
  video: "bg-jam",
  article: "bg-moss text-white",
  note: "bg-mist",
};

export function InspoCard({ item, onEdit, onDelete }: InspoCardProps) {
  const TypeIcon = typeIcons[item.type];

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border-[3px] border-night bg-white pixel-shadow pixel-shadow-hover h-[32rem] flex flex-col overflow-hidden"
    >
      {/* Card header bar */}
      <div
        className="flex items-center justify-between px-3 py-1.5 bg-night text-white cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <div className="flex items-center gap-2">
          <GripVertical className="w-3 h-3 opacity-50" />
          <TypeIcon className="w-3.5 h-3.5" />
          <span className="text-[10px] font-[family-name:var(--font-silkscreen)] uppercase">
            {item.type}
          </span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="p-0.5 hover:bg-white/20 transition-colors"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(item)}>
              <Edit2 className="w-3.5 h-3.5 mr-2" />
              Edit
            </DropdownMenuItem>
            {item.url && (
              <DropdownMenuItem asChild>
                <a href={item.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3.5 h-3.5 mr-2" />
                  Open Link
                </a>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => onDelete(item.id)}
              className="text-destructive"
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Image preview — fills remaining space above content */}
      {item.image_url ? (
        <div className="border-b-[3px] border-night overflow-hidden flex-1 min-h-0">
          <img
            src={item.image_url}
            alt={item.title || "Inspo image"}
            className="w-full h-full object-cover"
          />
        </div>
      ) : item.type === "video" && item.url ? (
        <div className="border-b-[3px] border-night overflow-hidden bg-night/5 flex-1 min-h-0 flex flex-col items-center justify-center gap-2">
          <Video className="w-8 h-8 text-jam" />
          <span className="text-[10px] font-[family-name:var(--font-silkscreen)] text-rock">
            Video
          </span>
        </div>
      ) : null}

      {/* Content */}
      <div className="p-3 flex-shrink-0">
        {item.title && (
          <h4 className="text-sm font-bold text-night mb-1 line-clamp-2">
            {item.title}
          </h4>
        )}
        {item.description && (
          <p className="text-xs text-rock line-clamp-3 mb-2">
            {item.description}
          </p>
        )}
        {item.user_note && (
          <div className="bg-mist/30 border-[2px] border-night/20 p-2 mb-2">
            <p className="text-xs text-night italic">{item.user_note}</p>
          </div>
        )}
        {item.site_name && (
          <div className="flex items-center gap-1.5 mb-2">
            {item.favicon_url && (
              <img src={item.favicon_url} alt="" className="w-3.5 h-3.5" />
            )}
            <span className="text-[10px] text-rock font-[family-name:var(--font-silkscreen)]">
              {item.site_name}
            </span>
          </div>
        )}

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className={cn("text-[9px]", typeColors[item.type])}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
