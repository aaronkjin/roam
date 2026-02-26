"use client";

import { Plus, Minus, Box, Home } from "lucide-react";

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onToggle3D: () => void;
  onResetView: () => void;
  is3D: boolean;
}

export function MapControls({
  onZoomIn,
  onZoomOut,
  onToggle3D,
  onResetView,
  is3D,
}: MapControlsProps) {
  const btnClass =
    "w-9 h-9 flex items-center justify-center border-[3px] border-night bg-milk text-night pixel-shadow-sm hover:bg-sky/50 transition-all duration-100 font-[family-name:var(--font-silkscreen)]";

  return (
    <div className="absolute bottom-6 right-3 z-10 flex flex-col gap-1.5">
      <button onClick={onZoomIn} className={btnClass} title="Zoom in">
        <Plus className="w-4 h-4" />
      </button>
      <button onClick={onZoomOut} className={btnClass} title="Zoom out">
        <Minus className="w-4 h-4" />
      </button>
      <button
        onClick={onToggle3D}
        className={`${btnClass} ${is3D ? "bg-jam text-white" : ""}`}
        title="Toggle 3D"
      >
        <Box className="w-4 h-4" />
      </button>
      <button onClick={onResetView} className={btnClass} title="Reset view">
        <Home className="w-4 h-4" />
      </button>
    </div>
  );
}
