"use client";

import { Button } from "@/components/ui/button";
import { PixelWindow } from "@/components/pixel/PixelWindow";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-6 max-w-md mx-auto mt-12">
      <PixelWindow title="Oops!" variant="jam">
        <div className="text-center py-6 space-y-4">
          <AlertTriangle className="w-12 h-12 text-jam mx-auto" />
          <p className="font-[family-name:var(--font-press-start)] text-sm text-night">
            Something went wrong
          </p>
          <p className="text-sm text-rock">
            {error.message || "An unexpected error occurred."}
          </p>
          <Button onClick={reset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </PixelWindow>
    </div>
  );
}
