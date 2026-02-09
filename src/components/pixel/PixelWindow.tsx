"use client";

import { cn } from "@/lib/utils";

interface PixelWindowProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "jam" | "moss" | "mist";
}

const variantColors = {
  default: "bg-night",
  jam: "bg-jam",
  moss: "bg-moss",
  mist: "bg-sky",
};

export function PixelWindow({
  title,
  children,
  className,
  variant = "default",
}: PixelWindowProps) {
  return (
    <div
      className={cn(
        "border-[3px] border-night bg-white pixel-shadow",
        className
      )}
    >
      {title && (
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-2 border-b-[3px] border-night text-white",
            variantColors[variant]
          )}
        >
          {/* Window decoration dots */}
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 bg-jam border border-night" />
            <div className="w-2.5 h-2.5 bg-grass border border-night" />
            <div className="w-2.5 h-2.5 bg-mist border border-night" />
          </div>
          <span className="font-[family-name:var(--font-silkscreen)] text-xs uppercase tracking-wider ml-1">
            {title}
          </span>
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
