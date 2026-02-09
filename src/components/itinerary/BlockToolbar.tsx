"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MapPin, Utensils, Bus, Hotel, StickyNote, Heading } from "lucide-react";
import type { BlockType } from "@/types/itinerary";

interface BlockToolbarProps {
  onAddBlock: (type: BlockType) => void;
}

const blockTypes: { type: BlockType; label: string; icon: React.ElementType }[] = [
  { type: "activity", label: "Activity", icon: MapPin },
  { type: "food", label: "Food & Drink", icon: Utensils },
  { type: "transport", label: "Transport", icon: Bus },
  { type: "accommodation", label: "Accommodation", icon: Hotel },
  { type: "note", label: "Note", icon: StickyNote },
  { type: "heading", label: "Heading", icon: Heading },
];

export function BlockToolbar({ onAddBlock }: BlockToolbarProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          Add Block
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {blockTypes.map((bt) => {
          const Icon = bt.icon;
          return (
            <DropdownMenuItem
              key={bt.type}
              onClick={() => onAddBlock(bt.type)}
            >
              <Icon className="w-3.5 h-3.5 mr-2" />
              {bt.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
