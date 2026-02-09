"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import type { InspoItem } from "@/types/inspo";

interface InspoPreviewProps {
  item: InspoItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InspoPreview({ item, open, onOpenChange }: InspoPreviewProps) {
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm">{item.title || "Untitled"}</DialogTitle>
        </DialogHeader>

        {item.image_url && (
          <div className="border-[3px] border-night overflow-hidden -mx-6">
            <img
              src={item.image_url}
              alt={item.title || ""}
              className="w-full max-h-64 object-cover"
            />
          </div>
        )}

        {item.description && (
          <p className="text-sm text-night">{item.description}</p>
        )}

        {item.user_note && (
          <div className="bg-mist/30 border-[2px] border-night/20 p-3">
            <p className="text-xs font-[family-name:var(--font-silkscreen)] uppercase text-rock mb-1">
              Your Note
            </p>
            <p className="text-sm text-night">{item.user_note}</p>
          </div>
        )}

        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {item.url && (
          <Button asChild variant="outline" size="sm" className="w-fit">
            <a href={item.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3.5 h-3.5 mr-2" />
              Open Original
            </a>
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
