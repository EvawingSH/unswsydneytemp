import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useMetaData } from "@/hooks/useMetaData";
import { useSuburbBoundaries } from "@/hooks/useSuburbData";
import { useVizStore } from "@/store/useVizStore";
import { SuburbLayer, SUBURB_PANE } from "@/components/map/layers/SuburbLayer";
import { HexLayer } from "@/components/map/layers/HexLayer";
import { Hex3DLayer } from "@/components/map/layers/Hex3DLayer";

// "light_nolabels" (geography/water, no street or suburb text) + "light_only_labels" (major place
// names only, transparent elsewhere) stacked together give a clean basemap close to designref/map1.png
// without the road/POI clutter of CARTO's full "light_all" style.
const CARTO_BASE_URL = "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png";
const CARTO_LABELS_URL = "https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png";
const CARTO_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

// Approximate centroid of the raster's bounding box (150.4753-151.4776E, -34.246 to -33.452S).
const DEFAULT_CENTER: [number, number] = [-33.849, 150.976];
const DEFAULT_ZOOM = 11;
// Zoomed in 1 level tighter than an exact bounds-fit, so the initial view is filled by the heat
// layer rather than showing a lot of empty margin around it.
const INITIAL_ZOOM_BOOST = 1;

function FitToRasterBounds() {
  const map = useMap();
  const { meta } = useMetaData();
  const fitted = useRef(false);

  useEffect(() => {
    if (!meta || fitted.current) return;
    const { originLon, originLat, scaleX, scaleY, width, height } = meta.raster;
    const bounds = L.latLngBounds(
      [originLat - height * scaleY, originLon],
      [originLat, originLon + width * scaleX],
    );
    // Compute the exact-fit zoom and center in one shot, then bump zoom — calling fitBounds()
    // followed by a separate setZoom() races against fitBounds' own internal animation and the
    // boost gets clobbered back to the exact-fit level.
    const targetZoom = map.getBoundsZoom(bounds) + INITIAL_ZOOM_BOOST;
    map.setView(bounds.getCenter(), targetZoom);
    fitted.current = true;
  }, [meta, map]);

  return null;
}

/**
 * Suburb borders render in their own pane, above the hex overlay (default overlayPane,
 * z-index 400), so they stay on top whenever suburb mode is active.
 */
function SuburbPaneSetup() {
  const map = useMap();

  useEffect(() => {
    if (map.getPane(SUBURB_PANE)) return;
    const pane = map.createPane(SUBURB_PANE);
    pane.style.zIndex = "450";
  }, [map]);

  return null;
}

/** Flies the map to the suburb selected via the sidebar's search combobox. */
function FlyToSelectedSuburb() {
  const map = useMap();
  const { data } = useSuburbBoundaries();
  const selectedSuburbCode = useVizStore((s) => s.selectedSuburbCode);

  useEffect(() => {
    if (!data || !selectedSuburbCode) return;
    const feature = data.features.find((f) => f.properties.salCode === selectedSuburbCode);
    if (!feature) return;
    const bounds = L.geoJSON(feature).getBounds();
    map.flyToBounds(bounds, { padding: [48, 48], maxZoom: 15 });
  }, [data, selectedSuburbCode, map]);

  return null;
}

/**
 * shadcn's Sidebar collapse animates the flex layout without firing a window resize event,
 * so Leaflet's cached container size goes stale and tiles render clipped until this fires.
 */
function InvalidateSizeOnResize() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);

  return null;
}

export function MapView() {
  const mode = useVizStore((s) => s.mode);
  const viewDimension = useVizStore((s) => s.viewDimension);

  return (
    <MapContainer
      preferCanvas
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      minZoom={6}
      maxZoom={17}
      className="h-full w-full"
    >
      <TileLayer url={CARTO_BASE_URL} attribution={CARTO_ATTRIBUTION} detectRetina />
      <TileLayer url={CARTO_LABELS_URL} detectRetina />
      {mode === "hex" && viewDimension === "2d" && <HexLayer />}
      {mode === "hex" && viewDimension === "3d" && <Hex3DLayer />}
      {mode === "suburb" && <SuburbLayer />}
      <SuburbPaneSetup />
      <FitToRasterBounds />
      <FlyToSelectedSuburb />
      <InvalidateSizeOnResize />
    </MapContainer>
  );
}
