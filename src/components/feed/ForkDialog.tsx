"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GitFork, Loader2 } from "lucide-react";
import type { PublishedItinerary } from "@/types/feed";

interface ForkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  published: PublishedItinerary;
  onFork: (title?: string) => Promise<any>;
}

export function ForkDialog({ open, onOpenChange, published, onFork }: ForkDialogProps) {
  const [title, setTitle] = useState(`Copy of ${published.title}`);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFork = async () => {
    setLoading(true);
    setError(null);
    try {
      const trip = await onFork(title);
      onOpenChange(false);
      // Navigate to the new trip
      window.location.href = `/trip/${trip.id}/itinerary`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to copy itinerary");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-[family-name:var(--font-press-start)] text-xs text-night">
            <GitFork className="w-4 h-4" />
            Copy Itinerary
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-mist/30 border-[2px] border-night/20 p-3 space-y-1">
            <p className="text-xs text-rock font-[family-name:var(--font-silkscreen)] uppercase">
              Source
            </p>
            <p className="text-sm font-bold text-night">{published.title}</p>
            <p className="text-xs text-rock">
              {published.day_count} {published.day_count === 1 ? "day" : "days"} &middot;{" "}
              {published.block_count} {published.block_count === 1 ? "activity" : "activities"}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-[family-name:var(--font-silkscreen)] text-night uppercase">
              Trip Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title for your copy"
              className="font-[family-name:var(--font-roboto-mono)]"
            />
          </div>

          {error && (
            <p className="text-xs text-jam font-[family-name:var(--font-silkscreen)]">
              {error}
            </p>
          )}

          <Button
            onClick={handleFork}
            disabled={loading || !title.trim()}
            className="w-full bg-jam text-white gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <GitFork className="w-4 h-4" />
            )}
            {loading ? "Copying..." : "Copy to My Trips"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
