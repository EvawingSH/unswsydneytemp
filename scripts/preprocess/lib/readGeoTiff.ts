import { fromFile } from "geotiff";
import type { RasterHeader } from "../../../src/lib/types.ts";

export interface RasterData {
  header: RasterHeader;
  values: Float64Array;
}

export async function readGeoTiffRaster(filePath: string): Promise<RasterData> {
  const tiff = await fromFile(filePath);
  const image = await tiff.getImage();
  const width = image.getWidth();
  const height = image.getHeight();
  const [originLon, originLat] = image.getOrigin();
  const [scaleX, scaleYRaw] = image.getResolution();
  const scaleY = Math.abs(scaleYRaw);

  const rasters = await image.readRasters();
  const values = rasters[0] as Float64Array;
  if (values.length !== width * height) {
    throw new Error(
      `Unexpected raster length ${values.length}, expected ${width * height} (${filePath})`,
    );
  }

  return {
    header: { originLon, originLat, scaleX, scaleY, width, height },
    values,
  };
}

export function assertHeadersMatch(
  a: RasterHeader,
  b: RasterHeader,
  labelA: string,
  labelB: string,
): void {
  const keys: (keyof RasterHeader)[] = [
    "originLon",
    "originLat",
    "scaleX",
    "scaleY",
    "width",
    "height",
  ];
  for (const key of keys) {
    if (Math.abs(a[key] - b[key]) > 1e-9) {
      throw new Error(
        `Raster header mismatch between ${labelA} and ${labelB} on "${key}": ${a[key]} vs ${b[key]}`,
      );
    }
  }
}
