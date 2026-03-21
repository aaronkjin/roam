"use client";

import { createContext, useContext, useState, useCallback, useRef } from "react";
import type { GeneratedItinerary, GenerationMode } from "@/types/itinerary";

interface GenerateRequestOptions {
  startDate?: string;
  endDate?: string;
  dateRangeLabel?: string;
  stayAddress?: string;
  notes?: string;
  budgetPreference?: "budget" | "balanced" | "luxury";
}

interface GenerationContextValue {
  generating: boolean;
  tripId: string | null;
  streamedText: string;
  result: GeneratedItinerary | null;
  error: string | null;
  generate: (
    tripId: string,
    mode: GenerationMode,
    numDays: number,
    selectedInspoIds?: string[],
    options?: GenerateRequestOptions
  ) => void;
  reset: () => void;
}

const GenerationContext = createContext<GenerationContextValue | null>(null);

export function GenerationProvider({ children }: { children: React.ReactNode }) {
  const [generating, setGenerating] = useState(false);
  const [tripId, setTripId] = useState<string | null>(null);
  const [streamedText, setStreamedText] = useState("");
  const [result, setResult] = useState<GeneratedItinerary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback(
    (
      newTripId: string,
      mode: GenerationMode,
      numDays: number,
      selectedInspoIds?: string[],
      options?: GenerateRequestOptions
    ) => {
      // Cancel any in-progress generation
      if (abortRef.current) {
        abortRef.current.abort();
      }

      const controller = new AbortController();
      abortRef.current = controller;

      setGenerating(true);
      setTripId(newTripId);
      setStreamedText("");
      setResult(null);
      setError(null);

      (async () => {
        try {
          const res = await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              trip_id: newTripId,
              mode,
              num_days: numDays,
              selected_inspo_ids: selectedInspoIds,
              start_date: options?.startDate,
              end_date: options?.endDate,
              date_range_label: options?.dateRangeLabel,
              stay_address: options?.stayAddress,
              notes: options?.notes,
              budget_preference: options?.budgetPreference,
            }),
            signal: controller.signal,
          });

          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || "Generation failed");
          }

          const reader = res.body?.getReader();
          if (!reader) throw new Error("No response body");

          const decoder = new TextDecoder();
          let fullText = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") break;

                try {
                  const parsed = JSON.parse(data);
                  fullText += parsed.text;
                  setStreamedText(fullText);
                } catch {
                  // skip malformed chunks
                }
              }
            }
          }

          // Parse the full response as JSON (with repair for truncated responses)
          try {
            const itinerary = JSON.parse(fullText) as GeneratedItinerary;
            setResult(itinerary);
          } catch {
            try {
              const lastBracket = fullText.lastIndexOf("}]");
              if (lastBracket > 0) {
                const repaired = fullText.slice(0, lastBracket + 2) + "}";
                const itinerary = JSON.parse(repaired) as GeneratedItinerary;
                setResult(itinerary);
              } else {
                setError("Failed to parse generated itinerary. Please try again.");
              }
            } catch {
              setError("Failed to parse generated itinerary. Please try again.");
            }
          }
        } catch (err) {
          if (err instanceof Error && err.name === "AbortError") return;
          setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
          setGenerating(false);
        }
      })();
    },
    []
  );

  const reset = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setGenerating(false);
    setTripId(null);
    setStreamedText("");
    setResult(null);
    setError(null);
  }, []);

  return (
    <GenerationContext.Provider
      value={{ generating, tripId, streamedText, result, error, generate, reset }}
    >
      {children}
    </GenerationContext.Provider>
  );
}

export function useGenerationContext() {
  const ctx = useContext(GenerationContext);
  if (!ctx) throw new Error("useGenerationContext must be used within a GenerationProvider");
  return ctx;
}
