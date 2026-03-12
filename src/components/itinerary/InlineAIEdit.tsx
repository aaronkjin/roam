"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PixelSpinner } from "@/components/pixel/PixelSpinner";
import { Sparkles, X } from "lucide-react";

interface InlineAIEditProps {
  selectedCount: number;
  loading: boolean;
  error: string | null;
  onSubmit: (instruction: string) => void;
  onCancel: () => void;
}

export function InlineAIEdit({
  selectedCount,
  loading,
  error,
  onSubmit,
  onCancel,
}: InlineAIEditProps) {
  const [instruction, setInstruction] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (instruction.trim() && !loading) {
      onSubmit(instruction.trim());
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90vw] max-w-lg bg-milk border-[3px] border-night pixel-shadow p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-[family-name:var(--font-silkscreen)] text-[10px] text-night">
          {selectedCount} block{selectedCount !== 1 ? "s" : ""} selected — AI
          Edit
        </span>
        <button onClick={onCancel} className="text-rock hover:text-night">
          <X className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-2">
          <PixelSpinner />
          <span className="text-xs text-rock">Thinking...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="Select block(s) and tell AI how to change them..."
            className="flex-1 border-[2px] border-night/20 px-2 py-1.5 text-xs bg-white outline-none focus:border-night"
            onKeyDown={(e) => {
              if (e.key === "Escape") onCancel();
            }}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!instruction.trim()}
            className="shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            Edit
          </Button>
        </form>
      )}

      {error && <p className="text-[10px] text-destructive">{error}</p>}
    </div>
  );
}
