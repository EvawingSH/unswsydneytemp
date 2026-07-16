import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const steps = ["01-fetch-boundaries.ts", "02-process-rasters.ts", "03-build-meta.ts"];

for (const step of steps) {
  console.log(`\n=== Running ${step} ===`);
  const result = spawnSync("npx", ["tsx", path.join(__dirname, step)], {
    stdio: "inherit",
  });
  if (result.status !== 0) {
    console.error(`\n${step} failed with exit code ${result.status}`);
    process.exit(result.status ?? 1);
  }
}

console.log("\n=== Preprocessing complete ===");
