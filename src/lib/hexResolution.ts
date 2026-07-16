/**
 * Maps the current Leaflet zoom level to one of the H3 resolutions precomputed by
 * scripts/preprocess (keep HEX_RESOLUTIONS there in sync with the resolutions listed here):
 * coarse binned hexagons at a city-wide zoom, fine near-point-level hexagons zoomed all the way in.
 */
const ZOOM_BREAKPOINTS: readonly { maxZoom: number; resolution: number }[] = [
  { maxZoom: 9, resolution: 7 },
  { maxZoom: 12, resolution: 8 },
  { maxZoom: Infinity, resolution: 9 },
];

export function resolutionForZoom(zoom: number): number {
  for (const { maxZoom, resolution } of ZOOM_BREAKPOINTS) {
    if (zoom <= maxZoom) return resolution;
  }
  return ZOOM_BREAKPOINTS[ZOOM_BREAKPOINTS.length - 1].resolution;
}
