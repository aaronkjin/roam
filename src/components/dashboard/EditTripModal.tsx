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
import { Trash2, ImageIcon, Loader2 } from "lucide-react";
import { buildDateRangeLabel } from "@/lib/trip-dates";
import type { Trip, UpdateTripInput } from "@/types/trip";

interface EditTripModalProps {
  trip: Trip | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, input: UpdateTripInput) => Promise<Trip | null>;
  onDelete?: (id: string) => Promise<boolean>;
}

function EditTripForm({
  trip,
  onSave,
  onClose,
  onDelete,
}: {
  trip: Trip;
  onSave: (id: string, input: UpdateTripInput) => Promise<Trip | null>;
  onClose: () => void;
  onDelete?: (id: string) => Promise<boolean>;
}) {
  const defaultExactDateRangeLabel = buildDateRangeLabel(trip.start_date, trip.end_date);
  const [title, setTitle] = useState(trip.title);
  const [destination, setDestination] = useState(trip.destination || "");
  const [description, setDescription] = useState(trip.description || "");
  const [startDate, setStartDate] = useState(trip.start_date || "");
  const [endDate, setEndDate] = useState(trip.end_date || "");
  const [dateRangeLabel, setDateRangeLabel] = useState(
    trip.date_range_label && trip.date_range_label !== defaultExactDateRangeLabel
      ? trip.date_range_label
      : ""
  );
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState(trip.cover_image_url || "");
  const [photoOptions, setPhotoOptions] = useState<string[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const exactDateRangeLabel = buildDateRangeLabel(startDate, endDate);
  const resolvedDateRangeLabel = exactDateRangeLabel || dateRangeLabel.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (!resolvedDateRangeLabel) return;

    setSaving(true);
    await onSave(trip.id, {
      title: title.trim(),
      destination: destination.trim() || undefined,
      description: description.trim() || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      date_range_label: resolvedDateRangeLabel,
      cover_image_url: coverImageUrl || undefined,
    });
    setSaving(false);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
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
        <div className="flex gap-2 items-center">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="flex-1"
          />
          <span className="text-xs text-rock font-[family-name:var(--font-silkscreen)] shrink-0">to</span>
          <Input
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => setEndDate(e.target.value)}
            className="flex-1"
          />
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
      </div>

      {/* Cover photo */}
      <div>
        <label className="block text-xs font-[family-name:var(--font-silkscreen)] uppercase text-night mb-1.5">
          <ImageIcon className="w-3 h-3 inline mr-1" />
          Cover Photo
        </label>
        {coverImageUrl && (
          <div className="relative w-full mb-2 border-[2px] border-night/20" style={{ aspectRatio: "16/7" }}>
            <img
              src={coverImageUrl}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          </div>
        )}
        {photoOptions.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-2">
            {photoOptions.map((url, i) => (
              <button
                key={i}
                type="button"
                className={`border-[2px] ${coverImageUrl === url ? "border-jam" : "border-night/20"} hover:border-jam transition-colors`}
                style={{ aspectRatio: "16/9" }}
                onClick={() => setCoverImageUrl(url)}
              >
                <img src={url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loadingPhotos || !destination.trim()}
          onClick={async () => {
            setLoadingPhotos(true);
            try {
              const res = await fetch(`/api/photos?q=${encodeURIComponent(destination.trim() + " travel")}&count=6`);
              const data = await res.json();
              if (data.urls?.length) setPhotoOptions(data.urls);
            } catch { /* ignore */ }
            setLoadingPhotos(false);
          }}
        >
          {loadingPhotos ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <ImageIcon className="w-3.5 h-3.5 mr-1" />}
          {photoOptions.length > 0 ? "Load More Photos" : "Choose Photo"}
        </Button>
        {!destination.trim() && (
          <p className="mt-1 text-[10px] text-rock">Add a destination above to search for cover photos.</p>
        )}
      </div>

      {onDelete && (
        <div className="pt-2">
          {confirmDelete ? (
            <div className="space-y-2 border-2 border-jam/60 bg-jam/5 p-3">
              <p className="text-xs text-jam font-[family-name:var(--font-silkscreen)] uppercase">
                Are you sure? This cannot be undone.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-jam border-jam hover:bg-jam/10"
                  disabled={deleting}
                  onClick={async () => {
                    setDeleting(true);
                    const success = await onDelete(trip.id);
                    if (success) {
                      onClose();
                      window.location.href = "/dashboard";
                    }
                    setDeleting(false);
                  }}
                >
                  {deleting ? "Deleting..." : "Yes, delete"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={deleting}
                  onClick={() => setConfirmDelete(false)}
                >
                  No
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-jam border-jam hover:bg-jam/10 gap-1.5"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Trip
            </Button>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-3 justify-end pt-2">
        <div className="flex gap-3 ml-auto">
          <Button type="button" variant="outline" onClick={onClose}>
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
                Saving...
              </span>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}

export function EditTripModal({ trip, open, onOpenChange, onSave, onDelete }: EditTripModalProps) {
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
            onDelete={onDelete}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
