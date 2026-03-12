"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, CheckCheck, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ItineraryBlock } from "@/types/itinerary";
import type { BlockEditSuggestion } from "@/hooks/useBlockAIEdit";

interface BlockDiffPreviewProps {
  originalBlocks: ItineraryBlock[];
  suggestions: BlockEditSuggestion[];
  onAccept: (blockId: string, suggestion: BlockEditSuggestion) => void;
  onReject: (blockId: string) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
}

function DiffField({
  label,
  original,
  suggested,
}: {
  label: string;
  original: string | null | undefined;
  suggested: string | null | undefined;
}) {
  if (!suggested || suggested === original) return null;

  return (
    <div className="space-y-0.5">
      <span className="text-[9px] font-[family-name:var(--font-silkscreen)] text-rock uppercase">
        {label}
      </span>
      <div className="flex flex-col gap-0.5">
        {original && (
          <span className="text-[11px] text-rock line-through">{original}</span>
        )}
        <span className="text-[11px] text-night bg-grass/20 px-1">{suggested}</span>
      </div>
    </div>
  );
}

export function BlockDiffPreview({
  originalBlocks,
  suggestions,
  onAccept,
  onReject,
  onAcceptAll,
  onRejectAll,
}: BlockDiffPreviewProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Global accept/reject */}
      <div className="flex items-center justify-between border-[2px] border-grass p-2 bg-grass/10">
        <span className="font-[family-name:var(--font-silkscreen)] text-[10px] text-night">
          {suggestions.length} suggestion{suggestions.length !== 1 ? "s" : ""}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRejectAll}>
            <XCircle className="w-3.5 h-3.5 mr-1" />
            Reject All
          </Button>
          <Button size="sm" onClick={onAcceptAll}>
            <CheckCheck className="w-3.5 h-3.5 mr-1" />
            Accept All
          </Button>
        </div>
      </div>

      {/* Per-block diffs */}
      {suggestions.map((suggestion) => {
        const original = originalBlocks.find((b) => b.id === suggestion.id);
        if (!original) return null;

        return (
          <div
            key={suggestion.id}
            className="border-[3px] border-grass bg-white p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <Badge className={cn("text-[9px] bg-grass text-night")}>
                Changed
              </Badge>
              <div className="flex gap-1">
                <button
                  onClick={() => onReject(suggestion.id)}
                  className="p-1 text-rock hover:text-destructive border-[2px] border-night/20 hover:border-destructive"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onAccept(suggestion.id, suggestion)}
                  className="p-1 text-rock hover:text-moss border-[2px] border-night/20 hover:border-moss"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <DiffField label="Title" original={original.title} suggested={suggestion.title} />
            <DiffField label="Description" original={original.description} suggested={suggestion.description} />
            <DiffField label="Location" original={original.location} suggested={suggestion.location} />
            <DiffField
              label="Time"
              original={`${original.start_time || ""}–${original.end_time || ""}`}
              suggested={
                suggestion.start_time || suggestion.end_time
                  ? `${suggestion.start_time || original.start_time || ""}–${suggestion.end_time || original.end_time || ""}`
                  : undefined
              }
            />
            <DiffField
              label="Cost"
              original={original.cost_estimate != null ? `$${original.cost_estimate}` : null}
              suggested={suggestion.cost_estimate != null ? `$${suggestion.cost_estimate}` : undefined}
            />
          </div>
        );
      })}
    </div>
  );
}
