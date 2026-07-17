import type { SuburbFeatureCollection } from "@/hooks/useSuburbData";
import type { RankingType } from "@/store/useVizStore";
import type { DateId, MetricMode, SuburbStats } from "@/lib/types";

export interface RankedSuburb {
  salCode: string;
  salName: string;
  value: number;
}

const RANKING_SIZE = 10;

/** Top 10 suburbs by mean/anomaly for the given date and metric, hottest or coldest first. */
export function rankSuburbs(
  boundaries: SuburbFeatureCollection,
  stats: SuburbStats,
  dateId: DateId,
  metric: MetricMode,
  ranking: RankingType,
): RankedSuburb[] {
  const dateStats = stats[dateId] ?? {};
  const withValues: RankedSuburb[] = [];
  for (const f of boundaries.features) {
    const entry = dateStats[f.properties.salCode];
    const value = metric === "absolute" ? entry?.mean : entry?.anomaly;
    if (value != null) {
      withValues.push({ salCode: f.properties.salCode, salName: f.properties.salName, value });
    }
  }
  withValues.sort((a, b) => (ranking === "hottest" ? b.value - a.value : a.value - b.value));
  return withValues.slice(0, RANKING_SIZE);
}
