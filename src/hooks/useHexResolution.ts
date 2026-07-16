import { useState } from "react";
import { useMap, useMapEvent } from "react-leaflet";
import { resolutionForZoom } from "@/lib/hexResolution";

/** Coarser hexagons zoomed out, finer near-point-level hexagons zoomed all the way in. */
export function useHexResolution(): number {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  useMapEvent("zoomend", () => setZoom(map.getZoom()));
  return resolutionForZoom(zoom);
}
