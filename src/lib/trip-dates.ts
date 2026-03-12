interface TripDateRangeOptions {
  startDate?: string | null;
  endDate?: string | null;
  dateRangeLabel?: string | null;
  monthStyle?: "short" | "long";
}

export function formatTripDate(dateStr: string, monthStyle: "short" | "long" = "short"): string {
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString("en-US", {
    month: monthStyle,
    day: "numeric",
    year: "numeric",
  });
}

export function buildDateRangeLabel(
  startDate?: string | null,
  endDate?: string | null,
  monthStyle: "short" | "long" = "short"
): string {
  if (startDate && endDate) {
    return `${formatTripDate(startDate, monthStyle)} - ${formatTripDate(endDate, monthStyle)}`;
  }

  if (startDate) {
    return formatTripDate(startDate, monthStyle);
  }

  if (endDate) {
    return formatTripDate(endDate, monthStyle);
  }

  return "";
}

export function formatTripDateRange({
  startDate,
  endDate,
  dateRangeLabel,
  monthStyle = "short",
}: TripDateRangeOptions): string | null {
  const label = dateRangeLabel?.trim();
  if (label) return label;

  const fallback = buildDateRangeLabel(startDate, endDate, monthStyle);
  return fallback || null;
}
