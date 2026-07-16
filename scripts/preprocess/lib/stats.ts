export interface RasterStats {
  min: number;
  max: number;
  mean: number;
  validCount: number;
}

export function computeRasterStats(values: Float64Array): RasterStats {
  let min = Infinity;
  let max = -Infinity;
  let sum = 0;
  let count = 0;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (Number.isNaN(v)) continue;
    if (v < min) min = v;
    if (v > max) max = v;
    sum += v;
    count++;
  }
  return { min, max, mean: sum / count, validCount: count };
}
