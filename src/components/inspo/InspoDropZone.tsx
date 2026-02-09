"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Upload, Link } from "lucide-react";

interface InspoDropZoneProps {
  onUrlDrop: (url: string) => void;
}

export function InspoDropZone({ onUrlDrop }: InspoDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const text = e.dataTransfer.getData("text/plain");
      if (text && isValidUrl(text)) {
        onUrlDrop(text);
      }

      const url = e.dataTransfer.getData("text/uri-list");
      if (url && isValidUrl(url)) {
        onUrlDrop(url);
      }
    },
    [onUrlDrop]
  );

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "border-[3px] border-dashed p-8 flex flex-col items-center justify-center gap-3 transition-colors",
        isDragging
          ? "border-jam bg-jam/10 text-jam"
          : "border-night/30 bg-white/50 text-rock"
      )}
    >
      {isDragging ? (
        <>
          <Upload className="w-8 h-8 animate-bounce" />
          <p className="font-[family-name:var(--font-silkscreen)] text-xs uppercase">
            Drop it here!
          </p>
        </>
      ) : (
        <>
          <Link className="w-6 h-6" />
          <p className="font-[family-name:var(--font-silkscreen)] text-xs uppercase">
            Drag & drop a URL here
          </p>
          <p className="text-[10px]">or use the Add button above</p>
        </>
      )}
    </div>
  );
}

function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}
