import type { GeneratedItinerary } from "@/types/itinerary";
import { haversine } from "./geo";

export interface ValidationWarning {
  severity: "warning" | "info";
  dayNumber: number;
  message: string;
}

/**
 * Validates a generated itinerary against density/timing/clustering rules.
 * Returns advisory warnings (does not block acceptance).
 */
export function validateItinerary(itinerary: GeneratedItinerary): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  for (const day of itinerary.days) {
    const blocks = day.blocks.filter(
      (b) => b.type !== "heading" && b.type !== "note"
    );

    // Check: minimum 5 activity/food blocks per day
    if (blocks.length < 5) {
      warnings.push({
        severity: "warning",
        dayNumber: day.day_number,
        message: `Only ${blocks.length} activities — consider adding more (recommended: 5+)`,
      });
    }

    // Check: time coverage (at least 10 hours)
    const times = blocks
      .filter((b) => b.start_time)
      .map((b) => {
        const [h, m] = (b.start_time || "09:00").split(":").map(Number);
        return h * 60 + m;
      })
      .sort((a, b) => a - b);

    if (times.length >= 2) {
      const coverageMinutes = times[times.length - 1] - times[0];
      if (coverageMinutes < 600) {
        warnings.push({
          severity: "info",
          dayNumber: day.day_number,
          message: `Day covers ${Math.round(coverageMinutes / 60)}h — consider extending to 10+ hours`,
        });
      }
    }

    // Check: any single activity > 3 hours
    for (const block of blocks) {
      if (block.duration_minutes && block.duration_minutes > 180) {
        warnings.push({
          severity: "warning",
          dayNumber: day.day_number,
          message: `"${block.title}" is ${block.duration_minutes}min — consider splitting into sub-activities`,
        });
      }
    }

    // Check: consecutive blocks > 5km apart
    const coordBlocks = blocks.filter(
      (b) => b.location_lat && b.location_lng
    );
    for (let i = 0; i < coordBlocks.length - 1; i++) {
      const a = coordBlocks[i];
      const b = coordBlocks[i + 1];
      const dist = haversine(
        a.location_lat!,
        a.location_lng!,
        b.location_lat!,
        b.location_lng!
      );
      if (dist > 5000) {
        warnings.push({
          severity: "info",
          dayNumber: day.day_number,
          message: `${a.title} → ${b.title} is ${(dist / 1000).toFixed(1)}km apart`,
        });
      }
    }

    // Check: gaps > 90 min between consecutive activities
    for (let i = 0; i < blocks.length - 1; i++) {
      const current = blocks[i];
      const next = blocks[i + 1];
      if (current.end_time && next.start_time) {
        const [ch, cm] = current.end_time.split(":").map(Number);
        const [nh, nm] = next.start_time.split(":").map(Number);
        const gap = (nh * 60 + nm) - (ch * 60 + cm);
        if (gap > 90) {
          warnings.push({
            severity: "warning",
            dayNumber: day.day_number,
            message: `${gap}min gap between "${current.title}" and "${next.title}"`,
          });
        }
      }
    }
  }

  return warnings;
}
