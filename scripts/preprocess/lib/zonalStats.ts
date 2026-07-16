import { bbox as turfBbox, booleanPointInPolygon } from "@turf/turf";
import type { RasterHeader } from "../../../src/lib/types.ts";
import { rowColToLonLat } from "./grid.ts";
import type { NormalizedFeatureCollection } from "./fetchSuburbBoundaries.ts";

export interface SuburbAggregate {
  sum: number;
  count: number;
}

interface ZonalIndex {
  lookup: (lon: number, lat: number) => number[];
}

function buildZonalIndex(
  fc: NormalizedFeatureCollection,
  bbox: [number, number, number, number],
  gridSize: number,
): ZonalIndex {
  const [minLon, minLat, maxLon, maxLat] = bbox;
  const cellW = (maxLon - minLon) / gridSize;
  const cellH = (maxLat - minLat) / gridSize;
  const index: number[][] = new Array(gridSize * gridSize);
  for (let i = 0; i < index.length; i++) index[i] = [];

  fc.features.forEach((feature, featureIdx) => {
    const [fMinLon, fMinLat, fMaxLon, fMaxLat] = turfBbox(feature);
    const startCol = Math.max(0, Math.floor((fMinLon - minLon) / cellW));
    const endCol = Math.min(gridSize - 1, Math.floor((fMaxLon - minLon) / cellW));
    const startRow = Math.max(0, Math.floor((fMinLat - minLat) / cellH));
    const endRow = Math.min(gridSize - 1, Math.floor((fMaxLat - minLat) / cellH));
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        index[r * gridSize + c].push(featureIdx);
      }
    }
  });

  function lookup(lon: number, lat: number): number[] {
    if (lon < minLon || lon > maxLon || lat < minLat || lat > maxLat) return [];
    let col = Math.floor((lon - minLon) / cellW);
    let row = Math.floor((lat - minLat) / cellH);
    if (col >= gridSize) col = gridSize - 1;
    if (row >= gridSize) row = gridSize - 1;
    if (col < 0) col = 0;
    if (row < 0) row = 0;
    return index[row * gridSize + col];
  }

  return { lookup };
}

export function computeZonalStats(
  header: RasterHeader,
  values: Float64Array,
  fc: NormalizedFeatureCollection,
  bbox: [number, number, number, number],
  gridSize: number,
  stride: number,
): Map<string, SuburbAggregate> {
  const { lookup } = buildZonalIndex(fc, bbox, gridSize);
  const result = new Map<string, SuburbAggregate>();

  for (let row = 0; row < header.height; row += stride) {
    const rowOffset = row * header.width;
    for (let col = 0; col < header.width; col += stride) {
      const v = values[rowOffset + col];
      if (Number.isNaN(v)) continue;
      const [lon, lat] = rowColToLonLat(header, row, col);
      const candidates = lookup(lon, lat);
      if (candidates.length === 0) continue;
      for (const idx of candidates) {
        const feature = fc.features[idx];
        if (booleanPointInPolygon([lon, lat], feature)) {
          const salCode = feature.properties.salCode;
          const entry = result.get(salCode);
          if (entry) {
            entry.sum += v;
            entry.count += 1;
          } else {
            result.set(salCode, { sum: v, count: 1 });
          }
          break;
        }
      }
    }
  }

  return result;
}
