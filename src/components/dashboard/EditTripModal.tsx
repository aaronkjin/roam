"use client";

import { useState } from "react";
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
import { PixelSpinner } from "@/components/pixel/PixelSpinner";
import type { Trip, UpdateTripInput } from "@/types/trip";

interface EditTripModalProps {
  trip: Trip | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, input: UpdateTripInput) => Promise<Trip | null>;
}

function EditTripForm({
  trip,
  onSave,
  onClose,
}: {
  trip: Trip;
  onSave: (id: string, input: UpdateTripInput) => Promise<Trip | null>;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(trip.title);
  const [destination, setDestination] = useState(trip.destination || "");
  const [description, setDescription] = useState(trip.description || "");
  const [startDate, setStartDate] = useState(trip.start_date || "");
  const [endDate, setEndDate] = useState(trip.end_date || "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    await onSave(trip.id, {
      title: title.trim(),
      destination: destination.trim() || undefined,
      description: description.trim() || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    });
    setSaving(false);
    onClose();
  };

  return (
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

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-[family-name:var(--font-silkscreen)] uppercase text-night mb-1.5">
            Start Date
          </label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-[family-name:var(--font-silkscreen)] uppercase text-night mb-1.5">
            End Date
          </label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={!title.trim() || saving}>
          {saving ? (
            <span className="flex items-center gap-2">
              <PixelSpinner size="sm" />
              Saving...
            </span>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </form>
  );
}

export function EditTripModal({ trip, open, onOpenChange, onSave }: EditTripModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Edit Trip</DialogTitle>
          <DialogDescription className="font-[family-name:var(--font-silkscreen)] text-xs">
            Update your adventure details
          </DialogDescription>
        </DialogHeader>
        {trip && (
          <EditTripForm
            key={trip.id}
            trip={trip}
            onSave={onSave}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
