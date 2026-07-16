import { useEffect, useRef } from "react";
import { GeoJSON } from "react-leaflet";
import type { Layer, PathOptions } from "leaflet";
import type { Feature, Geometry } from "geojson";
import { useSuburbBoundaries, useSuburbStats } from "@/hooks/useSuburbData";
import { useColorScale } from "@/hooks/useColorScale";
import { useVizStore } from "@/store/useVizStore";
import type { SuburbProperties, SuburbStats } from "@/lib/types";
import { NO_DATA_COLOR } from "@/lib/colorScales";

export const SUBURB_PANE = "suburbPane";
const OUTLINE_COLOR_ABSOLUTE = "#ffffff";
const OUTLINE_COLOR_ANOMALY = "#4b5563";
const OUTLINE_WEIGHT = 1;

/** Only mounted in suburb mode (see MapView) — renders the suburb choropleth + its outlines. */
export function SuburbLayer() {
  const dateId = useVizStore((s) => s.dateId);
  const metric = useVizStore((s) => s.metric);
  const opacity = useVizStore((s) => s.opacity);
  const filterRange = useVizStore((s) => s.filterRange);
  const { data } = useSuburbBoundaries();
  const { data: stats } = useSuburbStats();
  const active = useColorScale();

  // onEachFeature only runs once (when the underlying Leaflet layer is created), so it can't close
  // over fresh state directly — bridge via a ref + zustand's getState() for correctness on every hover.
  const statsRef = useRef<SuburbStats | null>(stats);
  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  if (!data) return null;

  const outlineColor = metric === "anomaly" ? OUTLINE_COLOR_ANOMALY : OUTLINE_COLOR_ABSOLUTE;

  const style = (feature?: Feature<Geometry, SuburbProperties>): PathOptions => {
    const salCode = feature!.properties.salCode;
    const entry = stats?.[dateId]?.[salCode];
    const value = metric === "absolute" ? entry?.mean : entry?.anomaly;

    if (value == null) {
      return {
        fillColor: NO_DATA_COLOR,
        fillOpacity: opacity * 0.6,
        color: outlineColor,
        weight: OUTLINE_WEIGHT,
        opacity: 0.9,
      };
    }

    const inRange = value >= filterRange[0] && value <= filterRange[1];
    return {
      fillColor: active.scale(value),
      fillOpacity: inRange ? opacity : 0,
      color: outlineColor,
      weight: OUTLINE_WEIGHT,
      opacity: inRange ? 0.9 : 0.35,
    };
  };

  const onEachFeature = (feature: Feature<Geometry, SuburbProperties>, layer: Layer) => {
    const salCode = feature.properties.salCode;
    const name = feature.properties.salName;
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
  };

  return (
    <GeoJSON data={data} style={style} onEachFeature={onEachFeature} pane={SUBURB_PANE} />
  );
}
