import { booleanPointInPolygon } from "@turf/turf";
import type { SuburbFeatureCollection } from "@/hooks/useSuburbData";
import type { SuburbProperties } from "@/lib/types";

/** The suburb (if any) whose polygon contains the given [lng, lat] point. */
export function findSuburbAtPoint(
  boundaries: SuburbFeatureCollection,
  point: [number, number],
): SuburbProperties | undefined {
  return boundaries.features.find((f) => booleanPointInPolygon(point, f))?.properties;
}
