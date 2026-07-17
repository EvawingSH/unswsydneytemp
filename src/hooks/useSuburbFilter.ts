import { useMemo } from "react";
import { useVizStore } from "@/store/useVizStore";
import { useSuburbBoundaries, useSuburbStats } from "@/hooks/useSuburbData";
import { rankSuburbs } from "@/lib/suburbRanking";

/**
 * Suburb codes the map should be restricted to — from the active ranking (hottest/coldest) or a
 * manual multi-select pick — or null when nothing is filtering (show everything). Shared by every
 * layer so hex and suburb-average visualizations apply the same restriction.
 */
export function useSuburbFilter(): Set<string> | null {
  const ranking = useVizStore((s) => s.ranking);
  const filterSuburbCodes = useVizStore((s) => s.filterSuburbCodes);
  const dateId = useVizStore((s) => s.dateId);
  const metric = useVizStore((s) => s.metric);
  const { data: boundaries } = useSuburbBoundaries();
  const { data: stats } = useSuburbStats();

  return useMemo(() => {
    if (ranking) {
      // Data not loaded yet — leave unfiltered rather than flash an empty map.
      if (!boundaries || !stats) return null;
      const ranked = rankSuburbs(boundaries, stats, dateId, metric, ranking);
      return new Set(ranked.map((r) => r.salCode));
    }
    if (filterSuburbCodes.length > 0) return new Set(filterSuburbCodes);
    return null;
  }, [ranking, filterSuburbCodes, boundaries, stats, dateId, metric]);
}
