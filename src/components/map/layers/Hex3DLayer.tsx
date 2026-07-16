import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import { GeoJsonLayer } from "@deck.gl/layers";
import type { Feature, Geometry } from "geojson";
import { useHexData } from "@/hooks/useHexData";
import { useHexResolution } from "@/hooks/useHexResolution";
import { useColorScale } from "@/hooks/useColorScale";
import { useVizStore } from "@/store/useVizStore";
import { ABSOLUTE_DOMAIN, ANOMALY_DOMAIN } from "@/lib/colorScales";
import { hexToRgba } from "@/lib/colorUtils";
import { PitchedDeckOverlay } from "@/lib/leafletDeckOverlay";
import type { HexProperties } from "@/lib/types";

const MAX_ELEVATION_METERS = 3000;

function valueOf(feature: Feature<Geometry, HexProperties>, metric: "absolute" | "anomaly") {
  return metric === "absolute" ? feature.properties.avgTemp : feature.properties.anomaly;
}

/** 3D counterpart to HexLayer: extrudes each hex by value (in addition to coloring by it) via deck.gl. */
export function Hex3DLayer() {
  const map = useMap();
  const dateId = useVizStore((s) => s.dateId);
  const metric = useVizStore((s) => s.metric);
  const opacity = useVizStore((s) => s.opacity);
  const filterRange = useVizStore((s) => s.filterRange);
  const resolution = useHexResolution();
  const { data } = useHexData(dateId, resolution);
  const active = useColorScale();
  const overlayRef = useRef<PitchedDeckOverlay | null>(null);

  useEffect(() => {
    const overlay = new PitchedDeckOverlay({ layers: [] });
    overlay.addTo(map);
    overlayRef.current = overlay;
    return () => {
      overlay.remove();
      overlayRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay || !data) return;

    const domain = metric === "absolute" ? ABSOLUTE_DOMAIN : ANOMALY_DOMAIN;
    const [domainMin, domainMax] = domain;

    const features = data.features.filter((f) => {
      const value = valueOf(f, metric);
      return value >= filterRange[0] && value <= filterRange[1];
    });

    const layer = new GeoJsonLayer<HexProperties>({
      id: "hex-3d",
      data: features,
      extruded: true,
      filled: true,
      stroked: false,
      pickable: true,
      autoHighlight: true,
      highlightColor: [255, 255, 255, 90],
      elevationScale: 1,
      material: { ambient: 0.5, diffuse: 0.7, shininess: 20, specularColor: [255, 255, 255] },
      getElevation: (f) => {
        const value = valueOf(f, metric);
        const t = Math.max(0, Math.min(1, (value - domainMin) / (domainMax - domainMin)));
        return t * MAX_ELEVATION_METERS;
      },
      getFillColor: (f) => hexToRgba(active.scale(valueOf(f, metric)), Math.round(opacity * 255)),
      updateTriggers: {
        getElevation: [metric],
        getFillColor: [metric, opacity, active],
      },
    });

    overlay.setProps({
      layers: [layer],
      getTooltip: ({ object }: { object?: Feature<Geometry, HexProperties> }) => {
        if (!object) return null;
        const value = valueOf(object, metric);
        const sign = metric === "anomaly" && value > 0 ? "+" : "";
        return { text: `${sign}${value.toFixed(2)}°C · ${object.properties.count} px` };
      },
    });
  }, [data, metric, opacity, filterRange, active]);

  return null;
}
