import { useMemo } from "react";
import { cellToLatLng } from "h3-js";
import { booleanPointInPolygon } from "@turf/turf";
import type { Feature, Geometry } from "geojson";
import { useSuburbBoundaries } from "@/hooks/useSuburbData";
import { useSuburbFilter } from "@/hooks/useSuburbFilter";
import type { HexProperties } from "@/lib/types";

/**
 * H3 indices whose center falls inside the active suburb filter, or null when unfiltered (every
 * hex passes). Joined against just the filtered suburbs' polygons — a ranking's top 10 or a small
 * manual pick, not all ~700+ suburbs — so it stays cheap even at the finest hex resolution
 * (~30k cells).
 */
export function useHexSuburbMembership(
  hexFeatures: Feature<Geometry, HexProperties>[] | undefined,
): Set<string> | null {
  const activeSuburbCodes = useSuburbFilter();
  const { data: boundaries } = useSuburbBoundaries();

  return useMemo(() => {
    if (!activeSuburbCodes) return null;
    if (!hexFeatures || !boundaries) return new Set<string>();

    const activePolygons = boundaries.features.filter((f) =>
      activeSuburbCodes.has(f.properties.salCode),
    );

    const passing = new Set<string>();
    for (const hex of hexFeatures) {
      const [lat, lng] = cellToLatLng(hex.properties.h3);
      const point: [number, number] = [lng, lat];
      if (activePolygons.some((polygon) => booleanPointInPolygon(point, polygon))) {
        passing.add(hex.properties.h3);
      }
    }
    return passing;
  }, [activeSuburbCodes, hexFeatures, boundaries]);
}
