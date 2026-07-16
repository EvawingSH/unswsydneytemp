import type { DateId, Season } from "@/lib/types";

/**
 * Simplified two-bucket season split for the 4 available dates (Southern Hemisphere):
 * Dec-Feb reads as summer; everything else in this dataset (May, Jun) reads as winter.
 * Not literal astronomical seasons — just enough to bucket the dates we actually have.
 */
export function seasonForDateId(dateId: DateId): Season {
  const month = Number(dateId.slice(5, 7));
  return month >= 3 && month <= 8 ? "winter" : "summer";
}

export function datesForSeason<T extends { id: DateId }>(
  dates: readonly T[],
  season: Season | null,
): readonly T[] {
  if (!season) return dates;
  return dates.filter((d) => seasonForDateId(d.id) === season);
}
