import fs from "node:fs";
import path from "node:path";
import { fromFile } from "geotiff";
import mapshaper from "mapshaper";
import { BOUNDARIES_DIR, DATA_DIR, DATE_FILES, OUTPUT_DIR } from "./config.ts";
import {
  fetchFromAbs,
  fetchFromOverpass,
  type NormalizedFeatureCollection,
} from "./lib/fetchSuburbBoundaries.ts";

async function getRasterBbox(): Promise<[number, number, number, number]> {
  const filePath = path.join(DATA_DIR, DATE_FILES[0].filename);
  const tiff = await fromFile(filePath);
  const image = await tiff.getImage();
  const [minLon, minLat, maxLon, maxLat] = image.getBoundingBox() as [
    number,
    number,
    number,
    number,
  ];
  return [minLon, minLat, maxLon, maxLat];
}

function readManualFile(): NormalizedFeatureCollection | null {
  const manualGeojson = path.join(BOUNDARIES_DIR, "manual.geojson");
  if (fs.existsSync(manualGeojson)) {
    console.log(`[boundaries] Using manually supplied file: ${manualGeojson}`);
    return JSON.parse(fs.readFileSync(manualGeojson, "utf-8"));
  }
  return null;
}

async function acquireRawBoundaries(
  bbox: [number, number, number, number],
): Promise<{ fc: NormalizedFeatureCollection; source: string }> {
  const manual = readManualFile();
  if (manual) return { fc: manual, source: "manual file" };

  const cachePath = path.join(BOUNDARIES_DIR, "sal_raw.geojson");
  if (fs.existsSync(cachePath)) {
    console.log(`[boundaries] Using cached fetch: ${cachePath}`);
    return {
      fc: JSON.parse(fs.readFileSync(cachePath, "utf-8")),
      source: "cache (ABS or Overpass, see cache file)",
    };
  }

  try {
    console.log("[boundaries] Fetching from ABS SAL ArcGIS REST service...");
    const fc = await fetchFromAbs(bbox);
    console.log(`[boundaries] ABS fetch OK: ${fc.features.length} suburbs`);
    fs.mkdirSync(BOUNDARIES_DIR, { recursive: true });
    fs.writeFileSync(cachePath, JSON.stringify(fc));
    return { fc, source: "ABS SAL ArcGIS REST" };
  } catch (err) {
    console.warn(`[boundaries] ABS fetch failed: ${(err as Error).message}`);
  }

  try {
    console.log("[boundaries] Falling back to OSM Overpass API...");
    const fc = await fetchFromOverpass(bbox);
    console.log(`[boundaries] Overpass fetch OK: ${fc.features.length} boundaries`);
    fs.mkdirSync(BOUNDARIES_DIR, { recursive: true });
    fs.writeFileSync(cachePath, JSON.stringify(fc));
    return { fc, source: "OSM Overpass" };
  } catch (err) {
    console.warn(`[boundaries] Overpass fetch failed: ${(err as Error).message}`);
  }

  throw new Error(
    "Could not acquire suburb boundaries from any source (manual file, ABS REST, OSM Overpass).\n" +
      `Please place a suburb boundary GeoJSON at ${path.join(BOUNDARIES_DIR, "manual.geojson")} ` +
      "and re-run this script.",
  );
}

function clipAndSimplify(
  fc: NormalizedFeatureCollection,
  bbox: [number, number, number, number],
): Promise<NormalizedFeatureCollection> {
  const [minLon, minLat, maxLon, maxLat] = bbox;
  const input = { "in.json": JSON.stringify(fc) };
  const cmd = `-i in.json -clip bbox=${minLon},${minLat},${maxLon},${maxLat} -simplify 12% keep-shapes -o out.json`;
  return new Promise((resolve, reject) => {
    mapshaper.applyCommands(cmd, input, (err: Error | null, output: Record<string, Buffer>) => {
      if (err) return reject(err);
      resolve(JSON.parse(output["out.json"].toString()));
    });
  });
}

async function main() {
  const bbox = await getRasterBbox();
  console.log(`[boundaries] Raster bbox: ${bbox.join(", ")}`);

  const { fc: raw, source } = await acquireRawBoundaries(bbox);
  console.log(`[boundaries] Source: ${source}, raw feature count: ${raw.features.length}`);

  const clipped = await clipAndSimplify(raw, bbox);
  console.log(`[boundaries] After clip+simplify: ${clipped.features.length} features`);

  const outDir = path.join(OUTPUT_DIR, "suburbs");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "boundaries.geojson");
  fs.writeFileSync(outPath, JSON.stringify(clipped));
  const sizeMb = fs.statSync(outPath).size / 1024 / 1024;
  console.log(`[boundaries] Wrote ${outPath} (${sizeMb.toFixed(2)} MB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
