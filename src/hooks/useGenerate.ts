"use client";

import { useState, useCallback } from "react";
import type { GeneratedItinerary, GenerationMode } from "@/types/itinerary";

interface UseGenerateOptions {
  tripId: string;
}

export function useGenerate({ tripId }: UseGenerateOptions) {
  const [generating, setGenerating] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const [result, setResult] = useState<GeneratedItinerary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(
    async (
      mode: GenerationMode,
      numDays: number,
      selectedInspoIds?: string[],
      options?: { startDate?: string; endDate?: string; stayAddress?: string }
    ) => {
      setGenerating(true);
      setStreamedText("");
      setResult(null);
      setError(null);

      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trip_id: tripId,
            mode,
            num_days: numDays,
            selected_inspo_ids: selectedInspoIds,
            start_date: options?.startDate,
            end_date: options?.endDate,
            stay_address: options?.stayAddress,
          }),
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

        // Parse the full response as JSON
        try {
          const itinerary = JSON.parse(fullText) as GeneratedItinerary;
          setResult(itinerary);
        } catch {
          setError("Failed to parse generated itinerary. Please try again.");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setGenerating(false);
      }
    },
    [tripId]
  );

  const reset = useCallback(() => {
    setStreamedText("");
    setResult(null);
    setError(null);
  }, []);

  return { generating, streamedText, result, error, generate, reset };
}
