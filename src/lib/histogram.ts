import type { DiscreteLegendStop } from "@/lib/colorScales";

export interface HistogramBin extends DiscreteLegendStop {
  count: number;
}

/**
 * Buckets values into the given legend stops' ranges. Values outside the domain clip to the
 * first/last bin, matching how the map's quantize/threshold color scales clip out-of-range values.
 */
export function buildHistogram(values: number[], stops: DiscreteLegendStop[]): HistogramBin[] {
  const bins: HistogramBin[] = stops.map((s) => ({ ...s, count: 0 }));
  for (const v of values) {
    let idx = stops.findIndex((s) => v >= s.rangeMin && v < s.rangeMax);
    if (idx === -1) {
      idx = v < stops[0].rangeMin ? 0 : bins.length - 1;
    }
    bins[idx].count++;
  }
  return bins;
}
