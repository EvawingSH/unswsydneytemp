import { create } from "zustand";
import type { DateId, MetricMode, Season, VisualizationMode } from "@/lib/types";
import { ABSOLUTE_DOMAIN, ANOMALY_DOMAIN } from "@/lib/colorScales";

export type ViewDimension = "2d" | "3d";
export type RankingType = "hottest" | "coldest";

export interface InspectedHex {
  h3: string;
  avgTemp: number;
  anomaly: number;
  count: number;
}

interface VizState {
  dateId: DateId;
  mode: VisualizationMode;
  metric: MetricMode;
  season: Season | null;
  /** Suburb codes to restrict both hex and suburb-average data to. Empty = show everything. */
  filterSuburbCodes: string[];
  /** The single suburb/hex last clicked on the map — drives the InfoBox card. Doesn't filter. */
  inspectedSuburbCode: string | null;
  inspectedHex: InspectedHex | null;
  opacity: number;
  viewDimension: ViewDimension;
  filterRange: [number, number];
  ranking: RankingType | null;
  exploreOpen: boolean;
  visualiseOpen: boolean;
  setDateId: (id: DateId) => void;
  setMode: (mode: VisualizationMode) => void;
  setMetric: (metric: MetricMode) => void;
  setSeason: (season: Season | null) => void;
  toggleSuburbFilter: (salCode: string) => void;
  clearSuburbFilter: () => void;
  inspectSuburb: (salCode: string) => void;
  inspectHex: (hex: InspectedHex) => void;
  clearInspection: () => void;
  setOpacity: (opacity: number) => void;
  setViewDimension: (dimension: ViewDimension) => void;
  setFilterRange: (range: [number, number]) => void;
  setRanking: (ranking: RankingType | null) => void;
  setExploreOpen: (open: boolean) => void;
  setVisualiseOpen: (open: boolean) => void;
}

export const useVizStore = create<VizState>((set) => ({
  dateId: "2023-02-02",
  mode: "hex",
  metric: "anomaly",
  season: "summer",
  filterSuburbCodes: [],
  inspectedSuburbCode: null,
  inspectedHex: null,
  opacity: 0.85,
  viewDimension: "2d",
  filterRange: ANOMALY_DOMAIN,
  ranking: null,
  exploreOpen: true,
  visualiseOpen: true,
  // A clicked hex is a value snapshot (see InspectedHex) rather than a live-updating reference, so
  // it's cleared on date change instead of silently going stale.
  setDateId: (dateId) => set({ dateId, inspectedHex: null }),
  setMode: (mode) => set({ mode }),
  setMetric: (metric) =>
    set({ metric, filterRange: metric === "absolute" ? ABSOLUTE_DOMAIN : ANOMALY_DOMAIN }),
  setSeason: (season) => set({ season }),
  // A manual pick is a distinct action from viewing a ranking, so it takes over as the active
  // filter — clearing whichever ranking was showing rather than combining with it. Selecting
  // suburbs only affects which data is shown — the viewport is left alone.
  toggleSuburbFilter: (salCode) =>
    set((state) => ({
      filterSuburbCodes: state.filterSuburbCodes.includes(salCode)
        ? state.filterSuburbCodes.filter((code) => code !== salCode)
        : [...state.filterSuburbCodes, salCode],
      ranking: null,
    })),
  clearSuburbFilter: () => set({ filterSuburbCodes: [] }),
  // Inspection is independent of the data filter — it only drives what the InfoBox card shows.
  inspectSuburb: (salCode) => set({ inspectedSuburbCode: salCode, inspectedHex: null }),
  inspectHex: (hex) => set({ inspectedHex: hex, inspectedSuburbCode: null }),
  clearInspection: () => set({ inspectedSuburbCode: null, inspectedHex: null }),
  setOpacity: (opacity) => set({ opacity }),
  setViewDimension: (viewDimension) => set({ viewDimension }),
  setFilterRange: (filterRange) => set({ filterRange }),
  // Viewing a ranking is the active filter for as long as it's open, replacing any manual pick.
  setRanking: (ranking) => set({ ranking, filterSuburbCodes: [] }),
  setExploreOpen: (exploreOpen) => set({ exploreOpen }),
  setVisualiseOpen: (visualiseOpen) => set({ visualiseOpen }),
}));
