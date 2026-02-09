"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTrips } from "@/hooks/useTrips";
import { PixelSpinner } from "@/components/pixel/PixelSpinner";

interface CreateTripModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTripModal({ open, onOpenChange }: CreateTripModalProps) {
  const router = useRouter();
  const { createTrip } = useTrips();
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    const trip = await createTrip({
      title: title.trim(),
      destination: destination.trim() || undefined,
      description: description.trim() || undefined,
    });
    setSaving(false);

    if (trip) {
      setTitle("");
      setDestination("");
      setDescription("");
      onOpenChange(false);
      router.push(`/trip/${trip.id}/inspo`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">New Adventure</DialogTitle>
          <DialogDescription className="font-[family-name:var(--font-silkscreen)] text-xs">
            Where are you dreaming of going?
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-[family-name:var(--font-silkscreen)] uppercase text-night mb-1.5">
              Trip Name *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Summer in Tokyo"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-[family-name:var(--font-silkscreen)] uppercase text-night mb-1.5">
              Destination
            </label>
            <Input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g., Tokyo, Japan"
            />
          </div>

          <div>
            <label className="block text-xs font-[family-name:var(--font-silkscreen)] uppercase text-night mb-1.5">
              Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's the vibe? What are you hoping to do?"
              rows={3}
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || saving}>
              {saving ? (
                <span className="flex items-center gap-2">
                  <PixelSpinner size="sm" />
                  Creating...
                </span>
              ) : (
                "Start Planning"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
