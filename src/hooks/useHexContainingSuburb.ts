import { useMemo } from "react";
import { cellToLatLng } from "h3-js";
import { useSuburbBoundaries } from "@/hooks/useSuburbData";
import { findSuburbAtPoint } from "@/lib/findSuburbAtPoint";

/** Name of the suburb (if any) whose polygon contains the given hex's center point. */
export function useHexContainingSuburb(h3: string | null): string | undefined {
  const { data: boundaries } = useSuburbBoundaries();

  return useMemo(() => {
    if (!h3 || !boundaries) return undefined;
    const [lat, lng] = cellToLatLng(h3);
    return findSuburbAtPoint(boundaries, [lng, lat])?.salName;
  }, [h3, boundaries]);
}
