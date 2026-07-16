import type { RasterHeader } from "../../../src/lib/types.ts";

/** Pixel (row, col) -> center [lon, lat]. Row 0 is the north edge (north-up raster). */
export function rowColToLonLat(
  header: RasterHeader,
  row: number,
  col: number,
): [number, number] {
  const lon = header.originLon + (col + 0.5) * header.scaleX;
  const lat = header.originLat - (row + 0.5) * header.scaleY;
  return [lon, lat];
}

export function rasterBoundingBox(
  header: RasterHeader,
): [number, number, number, number] {
  const minLon = header.originLon;
  const maxLon = header.originLon + header.width * header.scaleX;
  const maxLat = header.originLat;
  const minLat = header.originLat - header.height * header.scaleY;
  return [minLon, minLat, maxLon, maxLat];
}
