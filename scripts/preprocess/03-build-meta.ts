import fs from "node:fs";
import path from "node:path";
import type { DateId, Meta } from "../../src/lib/types.ts";
import { DATE_FILES, OUTPUT_DIR } from "./config.ts";

interface RawStatsFile {
  perDateRawStats: Record<
    string,
    { min: number; max: number; mean: number; validCount: number }
  >;
  header: Meta["raster"];
}

async function main() {
  const rawPath = path.join(OUTPUT_DIR, "_raster-stats.json");
  if (!fs.existsSync(rawPath)) {
    throw new Error(
      `Missing ${rawPath} — run 02-process-rasters.ts first (npm run preprocess runs all steps in order).`,
    );
  }
  const raw: RawStatsFile = JSON.parse(fs.readFileSync(rawPath, "utf-8"));

  let globalMin = Infinity;
  let globalMax = -Infinity;
  for (const s of Object.values(raw.perDateRawStats)) {
    if (s.min < globalMin) globalMin = s.min;
    if (s.max > globalMax) globalMax = s.max;
  }

  const perDate: Meta["perDate"] = {} as Meta["perDate"];
  for (const dateFile of DATE_FILES) {
    const s = raw.perDateRawStats[dateFile.id];
    perDate[dateFile.id as DateId] = {
      min: s.min,
      max: s.max,
      mean: s.mean,
      anomalyMin: s.min - s.mean,
      anomalyMax: s.max - s.mean,
      validCount: s.validCount,
    };
  }

  const meta: Meta = {
    dates: DATE_FILES.map((d) => ({ id: d.id as DateId, filename: d.filename, label: d.label })),
    perDate,
    globalMin,
    globalMax,
    raster: raw.header,
  };

  fs.writeFileSync(path.join(OUTPUT_DIR, "meta.json"), JSON.stringify(meta, null, 2));
  console.log(`[meta] Wrote meta.json (globalMin=${globalMin.toFixed(2)}, globalMax=${globalMax.toFixed(2)})`);

  fs.rmSync(rawPath);
  console.log(`[meta] Removed intermediate _raster-stats.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
