import fs from "node:fs";
import path from "node:path";
import type { RasterHeader, SuburbStats } from "../../src/lib/types.ts";
import {
  DATA_DIR,
  DATE_FILES,
  HEX_RESOLUTIONS,
  HEX_SHRINK_FACTOR,
  MIN_SUBURB_SAMPLE_COUNT,
  OUTPUT_DIR,
  ZONAL_INDEX_GRID_SIZE,
  ZONAL_STRIDE,
} from "./config.ts";
import { assertHeadersMatch, readGeoTiffRaster } from "./lib/readGeoTiff.ts";
import { computeRasterStats } from "./lib/stats.ts";
import { buildHexbin } from "./lib/hexbin.ts";
import { computeZonalStats } from "./lib/zonalStats.ts";
import { rasterBoundingBox } from "./lib/grid.ts";
import type { NormalizedFeatureCollection } from "./lib/fetchSuburbBoundaries.ts";

function round(n: number, precision: number): number {
  const f = 10 ** precision;
  return Math.round(n * f) / f;
}

async function main() {
  const boundariesPath = path.join(OUTPUT_DIR, "suburbs/boundaries.geojson");
  if (!fs.existsSync(boundariesPath)) {
    throw new Error(
      `Missing ${boundariesPath} — run 01-fetch-boundaries.ts first (npm run preprocess runs both in order).`,
    );
  }
  const suburbs: NormalizedFeatureCollection = JSON.parse(
    fs.readFileSync(boundariesPath, "utf-8"),
  );
  console.log(`[rasters] Loaded ${suburbs.features.length} suburb boundaries`);

  const hexDir = path.join(OUTPUT_DIR, "hex");
  const suburbsDir = path.join(OUTPUT_DIR, "suburbs");
  fs.mkdirSync(hexDir, { recursive: true });
  fs.mkdirSync(suburbsDir, { recursive: true });

  let referenceHeader: RasterHeader | null = null;
  let bbox: [number, number, number, number] | null = null;
  const perDateRawStats: Record<
    string,
    { min: number; max: number; mean: number; validCount: number }
  > = {};
  const suburbStats: SuburbStats = {} as SuburbStats;

  for (const dateFile of DATE_FILES) {
    const filePath = path.join(DATA_DIR, dateFile.filename);
    console.log(`\n[rasters] Processing ${dateFile.filename} (${dateFile.id})...`);
    const { header, values } = await readGeoTiffRaster(filePath);

    if (referenceHeader === null) {
      referenceHeader = header;
      bbox = rasterBoundingBox(header);
    } else {
      assertHeadersMatch(referenceHeader, header, DATE_FILES[0].filename, dateFile.filename);
    }

    const stats = computeRasterStats(values);
    perDateRawStats[dateFile.id] = stats;
    console.log(
      `[rasters]   stats: min=${stats.min.toFixed(2)} max=${stats.max.toFixed(2)} mean=${stats.mean.toFixed(2)} validCount=${stats.validCount} (${((stats.validCount / values.length) * 100).toFixed(1)}%)`,
    );

    // --- Hex data points, at every zoom-level resolution ---
    for (const resolution of HEX_RESOLUTIONS) {
      const hexFc = buildHexbin(header, values, resolution, stats.mean, HEX_SHRINK_FACTOR);
      fs.writeFileSync(
        path.join(hexDir, `hex-${dateFile.id}-res${resolution}.geojson`),
        JSON.stringify(hexFc),
      );
      console.log(
        `[rasters]   wrote hex/hex-${dateFile.id}-res${resolution}.geojson (${hexFc.features.length} hexagons)`,
      );
    }

    // --- Suburb average (zonal stats) ---
    const zonal = computeZonalStats(
      header,
      values,
      suburbs,
      bbox!,
      ZONAL_INDEX_GRID_SIZE,
      ZONAL_STRIDE,
    );
    const dateSuburbStats: SuburbStats[string] = {};
    for (const feature of suburbs.features) {
      const salCode = feature.properties.salCode;
      const agg = zonal.get(salCode);
      if (agg && agg.count >= MIN_SUBURB_SAMPLE_COUNT) {
        const mean = agg.sum / agg.count;
        dateSuburbStats[salCode] = {
          mean: round(mean, 3),
          count: agg.count,
          anomaly: round(mean - stats.mean, 3),
        };
      } else {
        dateSuburbStats[salCode] = {
          mean: null,
          count: agg?.count ?? 0,
          anomaly: null,
        };
      }
    }
    suburbStats[dateFile.id as keyof SuburbStats] = dateSuburbStats;
    const withData = Object.values(dateSuburbStats).filter((s) => s.mean !== null).length;
    console.log(
      `[rasters]   zonal stats: ${withData}/${suburbs.features.length} suburbs with data`,
    );
  }

  fs.writeFileSync(path.join(suburbsDir, "stats.json"), JSON.stringify(suburbStats));
  console.log(`\n[rasters] Wrote suburbs/stats.json`);

  fs.writeFileSync(
    path.join(OUTPUT_DIR, "_raster-stats.json"),
    JSON.stringify({ perDateRawStats, header: referenceHeader }),
  );
  console.log(`[rasters] Wrote intermediate _raster-stats.json for meta builder`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
