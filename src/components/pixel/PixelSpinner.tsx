"use client";

import { cn } from "@/lib/utils";

interface PixelSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-8 h-8",
  lg: "w-12 h-12",
};

export function PixelSpinner({ size = "md", className }: PixelSpinnerProps) {
  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      {/* 4 pixel blocks that animate in sequence */}
      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-0.5">
        <div
          className="bg-jam border border-night animate-[pixel-blink_1.2s_ease-in-out_infinite_0s]"
        />
        <div
          className="bg-grass border border-night animate-[pixel-blink_1.2s_ease-in-out_infinite_0.3s]"
        />
        <div
          className="bg-mist border border-night animate-[pixel-blink_1.2s_ease-in-out_infinite_0.9s]"
        />
        <div
          className="bg-moss border border-night animate-[pixel-blink_1.2s_ease-in-out_infinite_0.6s]"
        />
      </div>
      <style jsx>{`
        @keyframes pixel-blink {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
