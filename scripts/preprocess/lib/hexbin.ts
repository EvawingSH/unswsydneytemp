import * as h3 from "h3-js";
import type { Feature, FeatureCollection, Polygon } from "geojson";
import type { HexProperties, RasterHeader } from "../../../src/lib/types.ts";
import { rowColToLonLat } from "./grid.ts";
import { GEOJSON_COORD_PRECISION } from "../config.ts";

function round(n: number, precision: number): number {
  const f = 10 ** precision;
  return Math.round(n * f) / f;
}

/** Scale a closed ring's vertices toward its own centroid, leaving a visible gap between neighbors. */
function shrinkRing(ring: [number, number][], factor: number): [number, number][] {
  const n = ring.length - 1; // last point duplicates the first (closed ring)
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < n; i++) {
    cx += ring[i][0];
    cy += ring[i][1];
  }
  cx /= n;
  cy /= n;
  return ring.map(([x, y]) => [cx + (x - cx) * factor, cy + (y - cy) * factor]);
}

export function buildHexbin(
  header: RasterHeader,
  values: Float64Array,
  resolution: number,
  cityMean: number,
  shrinkFactor: number,
): FeatureCollection<Polygon, HexProperties> {
  const acc = new Map<string, { sum: number; count: number }>();

  for (let row = 0; row < header.height; row++) {
    const rowOffset = row * header.width;
    for (let col = 0; col < header.width; col++) {
      const v = values[rowOffset + col];
      if (Number.isNaN(v)) continue;
      const [lon, lat] = rowColToLonLat(header, row, col);
      const cell = h3.latLngToCell(lat, lon, resolution);
      const entry = acc.get(cell);
      if (entry) {
        entry.sum += v;
        entry.count += 1;
      } else {
        acc.set(cell, { sum: v, count: 1 });
      }
    }
  }

  const features: Feature<Polygon, HexProperties>[] = [];
  for (const [cell, { sum, count }] of acc) {
    const avgTemp = sum / count;
    // cellToBoundary(..., true) returns a closed [lng, lat] ring in GeoJSON order.
    const boundary = h3.cellToBoundary(cell, true) as [number, number][];
    const shrunk = shrinkRing(boundary, shrinkFactor);
    const ring = shrunk.map(([lng, lat]) => [
      round(lng, GEOJSON_COORD_PRECISION),
      round(lat, GEOJSON_COORD_PRECISION),
    ]);
    features.push({
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [ring] },
      properties: {
        h3: cell,
        avgTemp: round(avgTemp, 3),
        anomaly: round(avgTemp - cityMean, 3),
        count,
      },
    });
  }

  return { type: "FeatureCollection", features };
}
