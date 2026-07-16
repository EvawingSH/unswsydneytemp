import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

export const DATA_DIR = path.join(ROOT, "data");
export const BOUNDARIES_DIR = path.join(DATA_DIR, "boundaries");
export const OUTPUT_DIR = path.join(ROOT, "public/data/generated");

export const ZONAL_STRIDE = 2;
export const ZONAL_INDEX_GRID_SIZE = 100;
/** Coarse (city overview) -> fine (near point-level) H3 resolutions; frontend picks one per zoom level. */
export const HEX_RESOLUTIONS: number[] = [7, 8, 9];
/** Shrink each hex toward its own centroid by this factor to create a visible gap between neighbors. */
export const HEX_SHRINK_FACTOR = 0.85;
export const MIN_SUBURB_SAMPLE_COUNT = 20;
export const GEOJSON_COORD_PRECISION = 5;

export interface DateFileConfig {
  id: string;
  filename: string;
  label: string;
}

export const DATE_FILES: DateFileConfig[] = [
  { id: "2023-02-02", filename: "Ta_020223.tif", label: "2 Feb 2023" },
  { id: "2022-06-07", filename: "Ta_070622.tif", label: "7 Jun 2022" },
  { id: "2021-02-28", filename: "Ta_280221.tif", label: "28 Feb 2021" },
  { id: "2019-05-30", filename: "Ta_300519.tif", label: "30 May 2019" },
];
