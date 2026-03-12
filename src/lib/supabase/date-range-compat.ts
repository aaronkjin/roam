interface SupabaseErrorLike {
  code?: string;
  message?: string;
}

export function isMissingDateRangeLabelColumn(error: SupabaseErrorLike | null | undefined): boolean {
  if (!error) return false;

  return (
    error.code === "PGRST204" ||
    error.code === "42703" ||
    error.message?.includes("date_range_label") === true
  );
}
