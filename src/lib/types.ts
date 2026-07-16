export type DateId = "2023-02-02" | "2022-06-07" | "2021-02-28" | "2019-05-30";

export interface DateMeta {
  id: DateId;
  filename: string;
  label: string;
}

export interface PerDateStats {
  min: number;
  max: number;
  mean: number;
  anomalyMin: number;
  anomalyMax: number;
  validCount: number;
}

export interface RasterHeader {
  originLon: number;
  originLat: number;
  scaleX: number;
  scaleY: number;
  width: number;
  height: number;
}

export interface Meta {
  dates: DateMeta[];
  perDate: Record<DateId, PerDateStats>;
  globalMin: number;
  globalMax: number;
  raster: RasterHeader;
}

export interface SuburbProperties {
  salCode: string;
  salName: string;
}

export interface SuburbStatEntry {
  mean: number | null;
  count: number;
  anomaly: number | null;
}

export type SuburbStats = Record<DateId, Record<string, SuburbStatEntry>>;

export interface HexProperties {
  h3: string;
  avgTemp: number;
  anomaly: number;
  count: number;
}

export type VisualizationMode = "hex" | "suburb";
export type MetricMode = "absolute" | "anomaly";
export type Season = "summer" | "winter";
