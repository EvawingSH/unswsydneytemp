import { useMemo } from "react";
import { useVizStore } from "@/store/useVizStore";
import {
  ABSOLUTE_DOMAIN,
  ANOMALY_DOMAIN,
  absoluteScale,
  anomalyScale,
  type ColorScale,
} from "@/lib/colorScales";

export interface ActiveColorScale {
  scale: ColorScale;
  domain: [number, number];
}

/** Single source of truth for the active color scale, shared by the legend and every map layer. */
export function useColorScale(): ActiveColorScale {
  const metric = useVizStore((s) => s.metric);

  return useMemo(() => {
    if (metric === "absolute") {
      return { scale: absoluteScale(), domain: ABSOLUTE_DOMAIN };
    }
    return { scale: anomalyScale(), domain: ANOMALY_DOMAIN };
  }, [metric]);
}
