"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useInspoItems } from "@/hooks/useInspoItems";
import { useGenerate } from "@/hooks/useGenerate";
import { ModeToggle } from "./ModeToggle";
import { InspoSummary } from "./InspoSummary";
import { GenerateLoading } from "./GenerateLoading";
import { GeneratePreview } from "./GeneratePreview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PixelWindow } from "@/components/pixel/PixelWindow";
import { Sparkles, Lightbulb, MapPin, Calendar, SlidersHorizontal, Pencil } from "lucide-react";
import type { GenerationMode } from "@/types/itinerary";
import type { Trip, TripWithRole, UpdateTripInput } from "@/types/trip";
import Link from "next/link";
import { useTrips } from "@/context/TripsContext";
import { buildDateRangeLabel, formatTripDateRange } from "@/lib/trip-dates";

interface GeneratePanelProps {
  tripId: string;
}

function TripTimingModal({
  trip,
  open,
  onOpenChange,
  onSave,
}: {
  trip: Trip | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, input: UpdateTripInput) => Promise<Trip | null>;
}) {
  const initialExactTiming = buildDateRangeLabel(trip?.start_date, trip?.end_date);
  const [startDate, setStartDate] = useState(trip?.start_date || "");
  const [endDate, setEndDate] = useState(trip?.end_date || "");
  const [flexibleTiming, setFlexibleTiming] = useState(
    trip?.date_range_label && trip.date_range_label !== initialExactTiming
      ? trip.date_range_label
      : ""
  );
  const [saving, setSaving] = useState(false);

  if (!trip) return null;

  const exactDateRangeLabel = buildDateRangeLabel(startDate, endDate);
  const resolvedDateRangeLabel = exactDateRangeLabel || flexibleTiming.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Edit Trip Timing</DialogTitle>
          <DialogDescription className="font-[family-name:var(--font-silkscreen)] text-xs">
            Update dates without leaving the trip flow
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!resolvedDateRangeLabel) return;

            setSaving(true);
            await onSave(trip.id, {
              start_date: startDate || undefined,
              end_date: endDate || undefined,
              date_range_label: resolvedDateRangeLabel,
            });
            setSaving(false);
            onOpenChange(false);
          }}
        >
          <div>
            <label className="block text-xs font-[family-name:var(--font-silkscreen)] uppercase text-night mb-1.5">
              Exact Dates
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-[family-name:var(--font-silkscreen)] uppercase text-night mb-1.5">
              Flexible Timing {!exactDateRangeLabel && "*"}
            </label>
            <Input
              value={flexibleTiming}
              onChange={(e) => setFlexibleTiming(e.target.value)}
              placeholder="e.g., week in January or early spring break"
              required={!exactDateRangeLabel}
            />
            <p className="mt-1 text-[10px] text-rock">
              Leave this blank if you know the exact dates.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!resolvedDateRangeLabel || saving}>
              {saving ? "Saving..." : "Save Timing"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function GeneratePanel({ tripId }: GeneratePanelProps) {
  const { trips: allTrips, updateTrip, fetchTrips } = useTrips();
  const tripData = allTrips.find((t) => t.id === tripId);
  const userRole = tripData && "userRole" in tripData ? (tripData as TripWithRole).userRole : "owner";
  const canEdit = userRole === "owner" || userRole === "editor";
  const router = useRouter();
  const { items, loading: inspoLoading } = useInspoItems(tripId);
  const { generating, streamedText, result, error, generate, reset } = useGenerate({ tripId });

  const [mode, setMode] = useState<GenerationMode>("creative");
  const [numDays, setNumDays] = useState(3);
  const [stayAddress, setStayAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [budgetPreference, setBudgetPreference] = useState<"budget" | "balanced" | "luxury" | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [accepting, setAccepting] = useState(false);
  const [editTripOpen, setEditTripOpen] = useState(false);
  const exactDateRangeLabel = buildDateRangeLabel(
    tripData?.start_date,
    tripData?.end_date
  );
  const tripTiming = formatTripDateRange({
    startDate: tripData?.start_date,
    endDate: tripData?.end_date,
    dateRangeLabel: tripData?.date_range_label,
  });

  // Auto-calculate numDays from exact date range
  useEffect(() => {
    if (tripData?.start_date && tripData?.end_date) {
      const start = new Date(tripData.start_date);
      const end = new Date(tripData.end_date);
      const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      if (diff > 0 && diff <= 14) {
        setNumDays(diff);
      }
    }
  }, [tripData?.end_date, tripData?.start_date]);

  // Initialize selectedIds when items load
  useEffect(() => {
    if (items.length > 0 && selectedIds.size === 0) {
      setSelectedIds(new Set(items.map((i) => i.id)));
    }
  }, [items, selectedIds.size]);

  const toggleInspo = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleGenerate = useCallback(() => {
    if (selectedIds.size === 0) return;
    generate(mode, numDays, Array.from(selectedIds), {
      startDate: tripData?.start_date || undefined,
      endDate: tripData?.end_date || undefined,
      dateRangeLabel: tripData?.date_range_label || undefined,
      stayAddress: stayAddress || undefined,
      notes: notes.trim() || undefined,
      budgetPreference: budgetPreference || undefined,
    });
  }, [budgetPreference, generate, mode, notes, numDays, selectedIds, stayAddress, tripData?.date_range_label, tripData?.end_date, tripData?.start_date]);

  const handleAccept = useCallback(async () => {
    if (!result) return;
    setAccepting(true);

    try {
      // Save itinerary to DB
      const res = await fetch("/api/itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trip_id: tripId,
          days: result.days,
        }),
      });

      if (!res.ok) throw new Error("Failed to save itinerary");

      await fetchTrips();
      router.push(`/trip/${tripId}/itinerary`);
    } catch {
      // error handling
    } finally {
      setAccepting(false);
    }
  }, [fetchTrips, result, tripId, router]);

  if (inspoLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-mist/50 w-48" />
          <div className="h-32 bg-mist/30" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-6">
        <PixelWindow title="No Inspo Yet" variant="jam">
          <div className="text-center py-8 space-y-4">
            <Lightbulb className="w-12 h-12 text-jam mx-auto" />
            <p className="font-[family-name:var(--font-press-start)] text-sm text-night">
              Add some inspo first!
            </p>
            <p className="text-sm text-rock max-w-md mx-auto">
              Go to the Inspo board and collect some inspiration before generating your itinerary.
            </p>
            <Button asChild>
              <Link href={`/trip/${tripId}/inspo`}>Go to Inspo Board</Link>
            </Button>
          </div>
        </PixelWindow>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-base mb-1">Generate Itinerary</h2>
        <p className="text-xs text-rock font-[family-name:var(--font-silkscreen)]">
          Let AI plan your adventure based on your inspo
        </p>
      </div>

      {!canEdit && (
        <PixelWindow title="View Only" variant="mist">
          <div className="text-center py-6 space-y-2">
            <p className="text-sm text-rock">
              You have viewer access to this trip. Only editors and owners can generate itineraries.
            </p>
          </div>
        </PixelWindow>
      )}

      {canEdit && !generating && !result && (
        <>
          {/* Inspo selection */}
          <InspoSummary
            items={items}
            selectedIds={selectedIds}
            onToggle={toggleInspo}
          />

          {/* Settings */}
          <div className="space-y-4">
            {tripTiming && (
              <div className="border-[2px] border-night/15 bg-mist/20 px-3 py-2 text-xs text-rock flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Calendar className="w-3.5 h-3.5 text-night shrink-0" />
                  <span>
                    Trip timing: <span className="text-night font-medium">{tripTiming}</span>
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 shrink-0"
                  onClick={() => setEditTripOpen(true)}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit Dates
                </Button>
              </div>
            )}

            <div className="flex flex-wrap items-end gap-6">
              <div>
                <label className="block text-xs font-[family-name:var(--font-silkscreen)] uppercase text-night mb-1.5">
                  Days
                </label>
                <Input
                  type="number"
                  min={1}
                  max={14}
                  value={numDays}
                  onChange={(e) => setNumDays(Number(e.target.value))}
                  className="w-20"
                  disabled={!!exactDateRangeLabel}
                />
              </div>
            </div>

            {exactDateRangeLabel && (
              <p className="text-[10px] text-rock">
                Days are locked to the saved trip dates. Edit the trip timing to change this.
              </p>
            )}

            <div className="flex items-end gap-6">
              <div className="flex-1">
                <label className="block text-xs font-[family-name:var(--font-silkscreen)] uppercase text-night mb-1.5">
                  <MapPin className="w-3 h-3 inline mr-1" />
                  Where are you staying?
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Hotel Negresco, Nice"
                  value={stayAddress}
                  onChange={(e) => setStayAddress(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-[family-name:var(--font-silkscreen)] uppercase text-night mb-1.5">
                Notes for the Planner
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. The one thing I really want to do is a tea ceremony. I also want one quiet afternoon and minimal early mornings."
                rows={3}
              />
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-[family-name:var(--font-silkscreen)] uppercase text-night mb-1.5">
                  Mode
                </label>
                <ModeToggle mode={mode} onModeChange={setMode} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={`p-3 border-[2px] ${mode === "strict" ? "border-jam bg-jam/5" : "border-night/10"}`}>
                  <p className="text-xs font-[family-name:var(--font-silkscreen)] uppercase text-jam mb-1">
                    Strict Mode
                  </p>
                  <p className="text-[10px] text-rock">
                    Includes ALL your exact inspo spots. Perfect when you know exactly where you want to go.
                  </p>
                </div>
                <div className={`p-3 border-[2px] ${mode === "creative" ? "border-grass bg-grass/5" : "border-night/10"}`}>
                  <p className="text-xs font-[family-name:var(--font-silkscreen)] uppercase text-grass mb-1">
                    Creative Mode
                  </p>
                  <p className="text-[10px] text-rock">
                    Uses your inspo as vibes, adds hidden gems and surprises. Great for discovering new spots.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 border-[2px] border-night/10 p-3">
              <button
                type="button"
                className="flex items-center gap-2 text-xs font-[family-name:var(--font-silkscreen)] uppercase text-night cursor-pointer"
                onClick={() => setShowAdvanced((prev) => !prev)}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Advanced Preferences
              </button>

              {showAdvanced && (
                <div className="space-y-2">
                  <p className="text-[10px] text-rock">
                    Optional: guide the planner toward a more budget, balanced, or luxury itinerary.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "budget", label: "Budget" },
                      { value: "balanced", label: "Balanced" },
                      { value: "luxury", label: "Luxury" },
                    ].map((option) => (
                      <Button
                        key={option.value}
                        type="button"
                        variant="outline"
                        size="sm"
                        className={budgetPreference === option.value ? "bg-mist text-night border-night" : ""}
                        onClick={() =>
                          setBudgetPreference(option.value as "budget" | "balanced" | "luxury")
                        }
                      >
                        {option.label}
                      </Button>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className={budgetPreference === null ? "bg-mist text-night border-night" : ""}
                      onClick={() => setBudgetPreference(null)}
                    >
                      No Preference
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleGenerate}
                disabled={selectedIds.size === 0}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate
              </Button>
            </div>
          </div>

        </>
      )}

      {/* Loading */}
      {generating && <GenerateLoading streamedText={streamedText} />}

      {/* Error */}
      {error && (
        <PixelWindow title="Error" variant="jam">
          <div className="space-y-3">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={reset}>
              Try Again
            </Button>
          </div>
        </PixelWindow>
      )}

      {/* Preview */}
      {result && (
        <GeneratePreview
          itinerary={result}
          onAccept={handleAccept}
          onRegenerate={handleGenerate}
          accepting={accepting}
        />
      )}

      <TripTimingModal
        key={`${tripData?.id || "trip"}:${tripData?.start_date || ""}:${tripData?.end_date || ""}:${tripData?.date_range_label || ""}:${editTripOpen ? "open" : "closed"}`}
        trip={tripData || null}
        open={editTripOpen}
        onOpenChange={setEditTripOpen}
        onSave={updateTrip}
      />
    </div>
  );
}
