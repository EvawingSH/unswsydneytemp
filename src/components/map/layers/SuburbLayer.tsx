import { useEffect, useRef } from "react";
import { GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import type { Layer, Path, PathOptions } from "leaflet";
import type { Feature, Geometry } from "geojson";
import { useSuburbBoundaries, useSuburbStats } from "@/hooks/useSuburbData";
import { useColorScale } from "@/hooks/useColorScale";
import { useSuburbFilter } from "@/hooks/useSuburbFilter";
import { useVizStore } from "@/store/useVizStore";
import type { SuburbProperties, SuburbStats } from "@/lib/types";
import { NO_DATA_COLOR } from "@/lib/colorScales";

export const SUBURB_PANE = "suburbPane";
const OUTLINE_COLOR_ABSOLUTE = "#ffffff";
const OUTLINE_COLOR_ANOMALY = "#4b5563";
const OUTLINE_WEIGHT = 1;
// Shared by both the transient hover outline and the persistent "last clicked" outline.
const HIGHLIGHT_WEIGHT = 3;
const HIGHLIGHT_COLOR = "#1e3a8a";

/** Only mounted in suburb mode (see MapView) — renders the suburb choropleth + its outlines. */
export function SuburbLayer() {
  const map = useMap();
  const dateId = useVizStore((s) => s.dateId);
  const metric = useVizStore((s) => s.metric);
  const opacity = useVizStore((s) => s.opacity);
  const filterRange = useVizStore((s) => s.filterRange);
  const { data } = useSuburbBoundaries();
  const { data: stats } = useSuburbStats();
  const active = useColorScale();
  const activeSuburbCodes = useSuburbFilter();
  const inspectedSuburbCode = useVizStore((s) => s.inspectedSuburbCode);
  const inspectSuburb = useVizStore((s) => s.inspectSuburb);

  // onEachFeature only runs once (when the underlying Leaflet layer is created), so it can't close
  // over fresh state directly — bridge via a ref + zustand's getState() for correctness on every hover.
  const statsRef = useRef<SuburbStats | null>(stats);
  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  const outlineColor = metric === "anomaly" ? OUTLINE_COLOR_ANOMALY : OUTLINE_COLOR_ABSOLUTE;

  const style = (feature?: Feature<Geometry, SuburbProperties>): PathOptions => {
    const salCode = feature!.properties.salCode;
    const entry = stats?.[dateId]?.[salCode];
    const value = metric === "absolute" ? entry?.mean : entry?.anomaly;
    const inSuburbFilter = !activeSuburbCodes || activeSuburbCodes.has(salCode);
    const isSelected = salCode === inspectedSuburbCode;

    if (value == null) {
      return {
        fillColor: NO_DATA_COLOR,
        fillOpacity: inSuburbFilter ? opacity * 0.6 : 0,
        color: isSelected ? HIGHLIGHT_COLOR : outlineColor,
        weight: isSelected ? HIGHLIGHT_WEIGHT : OUTLINE_WEIGHT,
        opacity: inSuburbFilter ? 0.9 : 0.35,
      };
    }

    const inRange = value >= filterRange[0] && value <= filterRange[1] && inSuburbFilter;
    return {
      fillColor: active.scale(value),
      fillOpacity: inRange ? opacity : 0,
      color: isSelected ? HIGHLIGHT_COLOR : outlineColor,
      weight: isSelected ? HIGHLIGHT_WEIGHT : OUTLINE_WEIGHT,
      opacity: inRange ? 0.9 : 0.35,
    };
  };

  // onEachFeature only runs once, so its handlers can't close over a fresh `style` either. Leaflet's
  // own GeoJSON.resetStyle() falls back to the style captured at layer construction (not the latest
  // props), which would drop the "selected" highlight the instant the mouse left — so mouseout
  // recomputes via this ref instead, always the current render's `style` closure.
  const styleRef = useRef(style);
  useEffect(() => {
    styleRef.current = style;
  });

  if (!data) return null;

  const onEachFeature = (feature: Feature<Geometry, SuburbProperties>, layer: Layer) => {
    const salCode = feature.properties.salCode;
    const name = feature.properties.salName;
    const path = layer as Path;

    layer.bindTooltip("", { sticky: true });
    layer.on("tooltipopen", () => {
      const { dateId: currentDateId, metric: currentMetric } = useVizStore.getState();
      const entry = statsRef.current?.[currentDateId]?.[salCode];
      const value = currentMetric === "absolute" ? entry?.mean : entry?.anomaly;
      const text =
        value == null
          ? `${name} · no data`
          : `${name} · ${currentMetric === "anomaly" && value > 0 ? "+" : ""}${value.toFixed(2)}°C`;
      layer.setTooltipContent(text);
    });

    layer.on("mouseover", () => {
      path.setStyle({ weight: HIGHLIGHT_WEIGHT, color: HIGHLIGHT_COLOR });
      path.bringToFront();
    });
    layer.on("mouseout", () => {
      path.setStyle(styleRef.current(feature));
    });
    layer.on("click", () => {
      inspectSuburb(salCode);
      map.flyToBounds(L.geoJSON(feature).getBounds(), { padding: [64, 64], maxZoom: 15 });
    });
  };

  return <GeoJSON data={data} style={style} onEachFeature={onEachFeature} pane={SUBURB_PANE} />;
}
