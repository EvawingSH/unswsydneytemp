import { create } from "zustand";
import type { DateId, MetricMode, Season, VisualizationMode } from "@/lib/types";
import { ABSOLUTE_DOMAIN, ANOMALY_DOMAIN } from "@/lib/colorScales";

export type ViewDimension = "2d" | "3d";

interface VizState {
  dateId: DateId;
  mode: VisualizationMode;
  metric: MetricMode;
  season: Season | null;
  selectedSuburbCode: string | null;
  opacity: number;
  viewDimension: ViewDimension;
  filterRange: [number, number];
  exploreOpen: boolean;
  visualiseOpen: boolean;
  statsOpen: boolean;
  setDateId: (id: DateId) => void;
  setMode: (mode: VisualizationMode) => void;
  setMetric: (metric: MetricMode) => void;
  setSeason: (season: Season | null) => void;
  selectSuburb: (salCode: string | null) => void;
  setOpacity: (opacity: number) => void;
  setViewDimension: (dimension: ViewDimension) => void;
  setFilterRange: (range: [number, number]) => void;
  setExploreOpen: (open: boolean) => void;
  setVisualiseOpen: (open: boolean) => void;
  setStatsOpen: (open: boolean) => void;
}

export const useVizStore = create<VizState>((set) => ({
  dateId: "2023-02-02",
  mode: "hex",
  metric: "anomaly",
  season: "summer",
  selectedSuburbCode: null,
  opacity: 0.85,
  viewDimension: "2d",
  filterRange: ANOMALY_DOMAIN,
  exploreOpen: true,
  visualiseOpen: true,
  statsOpen: true,
  setDateId: (dateId) => set({ dateId }),
  setMode: (mode) => set({ mode }),
  setMetric: (metric) =>
    set({ metric, filterRange: metric === "absolute" ? ABSOLUTE_DOMAIN : ANOMALY_DOMAIN }),
  setSeason: (season) => set({ season }),
  selectSuburb: (selectedSuburbCode) =>
    set((state) => ({
      selectedSuburbCode,
      mode: selectedSuburbCode ? "suburb" : state.mode,
    })),
  setOpacity: (opacity) => set({ opacity }),
  setViewDimension: (viewDimension) => set({ viewDimension }),
  setFilterRange: (filterRange) => set({ filterRange }),
  setExploreOpen: (exploreOpen) => set({ exploreOpen }),
  setVisualiseOpen: (visualiseOpen) => set({ visualiseOpen }),
  setStatsOpen: (statsOpen) => set({ statsOpen }),
}));
