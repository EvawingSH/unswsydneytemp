import { GeoJSON } from "react-leaflet";
import type { Layer, PathOptions } from "leaflet";
import type { Feature, Geometry } from "geojson";
import { useHexData } from "@/hooks/useHexData";
import { useHexResolution } from "@/hooks/useHexResolution";
import { useColorScale } from "@/hooks/useColorScale";
import { useVizStore } from "@/store/useVizStore";
import type { HexProperties } from "@/lib/types";

export function HexLayer() {
  const dateId = useVizStore((s) => s.dateId);
  const metric = useVizStore((s) => s.metric);
  const opacity = useVizStore((s) => s.opacity);
  const filterRange = useVizStore((s) => s.filterRange);
  const resolution = useHexResolution();
  const { data } = useHexData(dateId, resolution);
  const active = useColorScale();

  if (!data) return null;

  const style = (feature?: Feature<Geometry, HexProperties>): PathOptions => {
    const props = feature!.properties;
    const value = metric === "absolute" ? props.avgTemp : props.anomaly;
    const inRange = value >= filterRange[0] && value <= filterRange[1];
    return {
      fillColor: active.scale(value),
      fillOpacity: inRange ? opacity : 0,
      stroke: false,
    };
  };

  const onEachFeature = (feature: Feature<Geometry, HexProperties>, layer: Layer) => {
    const props = feature.properties;
    const value = metric === "absolute" ? props.avgTemp : props.anomaly;
    const sign = metric === "anomaly" && value > 0 ? "+" : "";
    layer.bindTooltip(`${sign}${value.toFixed(2)}°C · ${props.count} px`, { sticky: true });
  };

  return (
    // Remount on date/resolution change: the GeoJSON layer only re-applies `style` on prop
    // updates, not `data` (different geometry needs a fresh Leaflet layer instance).
    <GeoJSON key={`${dateId}-${resolution}`} data={data} style={style} onEachFeature={onEachFeature} />
  );
}
