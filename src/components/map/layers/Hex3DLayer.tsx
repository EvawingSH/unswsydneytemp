import { useEffect, useRef } from "react";
import { useMap, useMapEvent } from "react-leaflet";
import { GeoJsonLayer } from "@deck.gl/layers";
import type { Feature, Geometry } from "geojson";
import { useHexData } from "@/hooks/useHexData";
import { useHexResolution } from "@/hooks/useHexResolution";
import { useColorScale } from "@/hooks/useColorScale";
import { useHexSuburbMembership } from "@/hooks/useHexSuburbMembership";
import { useVizStore } from "@/store/useVizStore";
import { hexToRgba } from "@/lib/colorUtils";
import { PitchedDeckOverlay } from "@/lib/leafletDeckOverlay";
import type { HexProperties } from "@/lib/types";

// Kept in sync with Suburb3DLayer's constant so hex and suburb heights read on the same scale.
const MAX_ELEVATION_METERS = 9000;

// react-leaflet's MapContainer runs with `preferCanvas`, so Leaflet keeps its own (often empty)
// canvas renderer sitting in the default 'overlayPane' — same pane the deck.gl overlay would use
// otherwise. That renderer canvas ends up on top in paint order and silently swallows every
// pointer event before deck.gl's own canvas ever sees them, breaking hover/click picking. Giving
// the overlay its own pane (just above overlayPane) avoids the conflict entirely.
const HEX_DECK_PANE = "hexDeckPane";

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
  const hexSuburbMembership = useHexSuburbMembership(data?.features);
  const inspectHex = useVizStore((s) => s.inspectHex);
  const overlayRef = useRef<PitchedDeckOverlay | null>(null);

  useEffect(() => {
    if (!map.getPane(HEX_DECK_PANE)) {
      const pane = map.createPane(HEX_DECK_PANE);
      pane.style.zIndex = "405";
    }
    const overlay = new PitchedDeckOverlay({ layers: [] }, { pane: HEX_DECK_PANE });
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

    const features = data.features.filter((f) => {
      const value = valueOf(f, metric);
      const inValueRange = value >= filterRange[0] && value <= filterRange[1];
      const inSuburbFilter = !hexSuburbMembership || hexSuburbMembership.has(f.properties.h3);
      return inValueRange && inSuburbFilter;
    });

    // Stretch elevation across the range of values in the whole date's dataset (rather than the
    // fixed color-legend domain) so real differences between hexes use the full height budget
    // instead of being compressed into whatever narrow slice of the domain the data occupies.
    // Deliberately computed from the *unfiltered* set — using filterRange here would make the
    // filter slider rescale every remaining hex's height as you drag it, which reads as the data
    // changing rather than just being hidden/shown.
    let elevMin = Infinity;
    let elevMax = -Infinity;
    for (const f of data.features) {
      const value = valueOf(f, metric);
      if (value < elevMin) elevMin = value;
      if (value > elevMax) elevMax = value;
    }
    const elevSpan = elevMax - elevMin;

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
        const t = elevSpan > 0 ? (value - elevMin) / elevSpan : 0.5;
        return t * MAX_ELEVATION_METERS;
      },
      getFillColor: (f) => hexToRgba(active.scale(valueOf(f, metric)), Math.round(opacity * 255)),
      updateTriggers: {
        getElevation: [metric, elevMin, elevMax],
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
  }, [data, metric, opacity, filterRange, active, hexSuburbMembership]);

  // deck.gl's own gesture-recognizer-driven layer onClick never fires reliably through the
  // Leaflet overlay (see PitchedDeckOverlay.pickObjectAt) — so pick directly off Leaflet's click
  // event instead, which is unaffected by whatever's swallowing the deck.gl-internal gesture.
  useMapEvent("click", (e) => {
    const info = overlayRef.current?.pickObjectAt(e.originalEvent.clientX, e.originalEvent.clientY);
    const object = info?.object as Feature<Geometry, HexProperties> | undefined;
    if (object) inspectHex(object.properties);
  });

  return null;
}
