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
import { useTrips } from "@/context/TripsContext";
import { PixelSpinner } from "@/components/pixel/PixelSpinner";
import { buildDateRangeLabel } from "@/lib/trip-dates";

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
  const [dateRangeLabel, setDateRangeLabel] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);
  const exactDateRangeLabel = buildDateRangeLabel(startDate, endDate);
  const resolvedDateRangeLabel = exactDateRangeLabel || dateRangeLabel.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (!resolvedDateRangeLabel) return;

    setSaving(true);
    const trip = await createTrip({
      title: title.trim(),
      destination: destination.trim() || undefined,
      description: description.trim() || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      date_range_label: resolvedDateRangeLabel,
    });
    setSaving(false);

    if (trip) {
      setTitle("");
      setDestination("");
      setDescription("");
      setDateRangeLabel("");
      setStartDate("");
      setEndDate("");
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
              Exact Dates
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Input
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-[family-name:var(--font-silkscreen)] uppercase text-night mb-1.5">
              Flexible Timing {!exactDateRangeLabel && "*"}
            </label>
            <Input
              value={dateRangeLabel}
              onChange={(e) => setDateRangeLabel(e.target.value)}
              placeholder="e.g., week in January or early spring break"
              required={!exactDateRangeLabel}
            />
            <p className="mt-1 text-[10px] text-rock">
              Leave this blank if you know the exact dates. Use it only for a rough window.
            </p>
            {exactDateRangeLabel && (
              <p className="mt-1 text-[10px] text-night">
                Saved timing: {exactDateRangeLabel}
              </p>
            )}
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
            <Button
              type="submit"
              disabled={
                !title.trim() ||
                !resolvedDateRangeLabel ||
                saving
              }
            >
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
