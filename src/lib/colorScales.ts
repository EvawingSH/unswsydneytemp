import { scaleQuantize, scaleThreshold } from "d3-scale";

export type ColorScale = (value: number) => string;

/** 10-step blue-to-red palette, sampled from designref/colorgrade.png. */
export const TEMPERATURE_COLOR_STOPS: readonly string[] = [
  "#2b78b9",
  "#609d92",
  "#b6e299",
  "#dff595",
  "#fef6af",
  "#fed984",
  "#fdad63",
  "#fb814e",
  "#f9683e",
  "#df483e",
];

/** Marks "about average" on the anomaly scale — a 1°-wide white band centered on 0. */
export const AVERAGE_COLOR = "#ffffff";
const ANOMALY_WHITE_BAND_HALF_WIDTH = 0.5;

/** Below average: blue -> green only (no yellow). */
const ANOMALY_COOL_STOPS: readonly string[] = [
  "#2b78b9",
  "#468aa5",
  "#609d92",
  "#8bbf96",
  "#b6e299",
];

/** Above average: yellow -> red only (no green). */
const ANOMALY_WARM_STOPS: readonly string[] = [
  "#feff9d",
  "#fed984",
  "#fdad63",
  "#f9683e",
  "#df483e",
];

export const ABSOLUTE_DOMAIN: [number, number] = [10, 30];
export const ANOMALY_DOMAIN: [number, number] = [-3, 3];

export const NO_DATA_COLOR = "#d1d5db";

export interface DiscreteLegendStop {
  color: string;
  rangeMin: number;
  rangeMax: number;
}

/** Absolute temperature: 10 discrete steps over a fixed 10–30°C range. */
export function absoluteScale(): ColorScale {
  const scale = scaleQuantize<string>().domain(ABSOLUTE_DOMAIN).range(TEMPERATURE_COLOR_STOPS);
  return (value: number) => scale(value);
}

export function absoluteLegendStops(): DiscreteLegendStop[] {
  const [min, max] = ABSOLUTE_DOMAIN;
  const n = TEMPERATURE_COLOR_STOPS.length;
  const step = (max - min) / n;
  return TEMPERATURE_COLOR_STOPS.map((color, i) => ({
    color,
    rangeMin: min + i * step,
    rangeMax: min + (i + 1) * step,
  }));
}

/**
 * vs. city average: below average runs blue -> green, above average runs yellow -> red, with a
 * 1°-wide white band inserted at the center to mark "about average" — so warm/cool read
 * unambiguously instead of sharing a yellow-ish midpoint.
 */
function anomalyBandsAndColors(): { thresholds: number[]; colors: string[] } {
  const [min, max] = ANOMALY_DOMAIN;
  const half = ANOMALY_COOL_STOPS.length;
  const coolStep = (-ANOMALY_WHITE_BAND_HALF_WIDTH - min) / half;
  const warmStep = (max - ANOMALY_WHITE_BAND_HALF_WIDTH) / half;

  const thresholds: number[] = [];
  for (let i = 1; i < half; i++) thresholds.push(min + i * coolStep);
  thresholds.push(-ANOMALY_WHITE_BAND_HALF_WIDTH, ANOMALY_WHITE_BAND_HALF_WIDTH);
  for (let i = 1; i < half; i++) thresholds.push(ANOMALY_WHITE_BAND_HALF_WIDTH + i * warmStep);

  return { thresholds, colors: [...ANOMALY_COOL_STOPS, AVERAGE_COLOR, ...ANOMALY_WARM_STOPS] };
}

export function anomalyScale(): ColorScale {
  const { thresholds, colors } = anomalyBandsAndColors();
  const scale = scaleThreshold<number, string>().domain(thresholds).range(colors);
  return (value: number) => scale(value);
}

export function anomalyLegendStops(): DiscreteLegendStop[] {
  const [min, max] = ANOMALY_DOMAIN;
  const { thresholds, colors } = anomalyBandsAndColors();
  const boundaries = [min, ...thresholds, max];
  return colors.map((color, i) => ({
    color,
    rangeMin: boundaries[i],
    rangeMax: boundaries[i + 1],
  }));
}
