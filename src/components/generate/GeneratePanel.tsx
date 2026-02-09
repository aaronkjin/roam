"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useInspoItems } from "@/hooks/useInspoItems";
import { useGenerate } from "@/hooks/useGenerate";
import { ModeToggle } from "./ModeToggle";
import { InspoSummary } from "./InspoSummary";
import { GenerateLoading } from "./GenerateLoading";
import { GeneratePreview } from "./GeneratePreview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PixelWindow } from "@/components/pixel/PixelWindow";
import { Sparkles, Lightbulb } from "lucide-react";
import type { GenerationMode } from "@/types/itinerary";
import Link from "next/link";

interface GeneratePanelProps {
  tripId: string;
}

export function GeneratePanel({ tripId }: GeneratePanelProps) {
  const router = useRouter();
  const { items, loading: inspoLoading } = useInspoItems(tripId);
  const { generating, streamedText, result, error, generate, reset } = useGenerate({ tripId });

  const [mode, setMode] = useState<GenerationMode>("creative");
  const [numDays, setNumDays] = useState(3);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [accepting, setAccepting] = useState(false);

  // Initialize selectedIds when items load
  useMemo(() => {
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
    generate(mode, numDays, Array.from(selectedIds));
  }, [generate, mode, numDays, selectedIds]);

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

      router.push(`/trip/${tripId}/itinerary`);
    } catch {
      // error handling
    } finally {
      setAccepting(false);
    }
  }, [result, tripId, router]);

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

      {!generating && !result && (
        <>
          {/* Inspo selection */}
          <InspoSummary
            items={items}
            selectedIds={selectedIds}
            onToggle={toggleInspo}
          />

          {/* Settings */}
          <div className="flex flex-wrap items-end gap-6">
            <div>
              <label className="block text-xs font-[family-name:var(--font-silkscreen)] uppercase text-night mb-1.5">
                Mode
              </label>
              <ModeToggle mode={mode} onModeChange={setMode} />
            </div>

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
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={selectedIds.size === 0}
              className="ml-auto"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate
            </Button>
          </div>

          {/* Mode descriptions */}
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
    </div>
  );
}
