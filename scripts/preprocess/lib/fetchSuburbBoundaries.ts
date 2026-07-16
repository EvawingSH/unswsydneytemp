import type { Feature, FeatureCollection, Polygon, MultiPolygon } from "geojson";

const ABS_QUERY_URL =
  "https://geo.abs.gov.au/arcgis/rest/services/ASGS2021/SAL/MapServer/1/query";
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

export interface NormalizedProperties {
  salCode: string;
  salName: string;
}

export type NormalizedFeature = Feature<Polygon | MultiPolygon, NormalizedProperties>;
export type NormalizedFeatureCollection = FeatureCollection<
  Polygon | MultiPolygon,
  NormalizedProperties
>;

function bboxParam(bbox: [number, number, number, number]): string {
  return bbox.join(",");
}

function buildUrl(params: Record<string, string>): string {
  const url = new URL(ABS_QUERY_URL);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return url.toString();
}

/** Primary source: ABS Suburbs & Localities (SAL) 2021 boundaries via the public ArcGIS REST API. */
export async function fetchFromAbs(
  bbox: [number, number, number, number],
): Promise<NormalizedFeatureCollection> {
  const baseParams = {
    where: "1=1",
    outFields: "sal_code_2021,sal_name_2021,state_name_2021",
    geometry: bboxParam(bbox),
    geometryType: "esriGeometryEnvelope",
    inSR: "4326",
    outSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
  };

  const countRes = await fetch(
    buildUrl({ ...baseParams, f: "json", returnCountOnly: "true" }),
  );
  if (!countRes.ok) {
    throw new Error(`ABS count query failed: HTTP ${countRes.status}`);
  }
  const countJson = (await countRes.json()) as { count?: number };
  const total = countJson.count ?? 0;
  if (total === 0) {
    throw new Error("ABS query returned 0 suburbs for the raster bounding box");
  }

  const pageSize = 2000;
  const features: NormalizedFeature[] = [];
  for (let offset = 0; offset < total; offset += pageSize) {
    const res = await fetch(
      buildUrl({
        ...baseParams,
        f: "geojson",
        resultOffset: String(offset),
        resultRecordCount: String(pageSize),
      }),
    );
    if (!res.ok) {
      throw new Error(`ABS geojson query failed at offset ${offset}: HTTP ${res.status}`);
    }
    const fc = (await res.json()) as FeatureCollection<
      Polygon | MultiPolygon,
      Record<string, unknown>
    >;
    for (const f of fc.features) {
      if (f.geometry?.type !== "Polygon" && f.geometry?.type !== "MultiPolygon") continue;
      const props = f.properties ?? {};
      features.push({
        type: "Feature",
        geometry: f.geometry,
        properties: {
          salCode: String(props.sal_code_2021 ?? "unknown"),
          salName: String(props.sal_name_2021 ?? "Unknown"),
        },
      });
    }
  }

  return { type: "FeatureCollection", features };
}

/** Fallback source: OSM administrative boundaries (admin_level=10 ~= suburb/locality in AU) via Overpass. */
export async function fetchFromOverpass(
  bbox: [number, number, number, number],
): Promise<NormalizedFeatureCollection> {
  const [minLon, minLat, maxLon, maxLat] = bbox;
  const query = `[out:json][timeout:120];
(
  relation["boundary"="administrative"]["admin_level"="10"](${minLat},${minLon},${maxLat},${maxLon});
);
out body;
>;
out skel qt;`;

  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: query,
  });
  if (!res.ok) {
    throw new Error(`Overpass query failed: HTTP ${res.status}`);
  }
  const osmJson = await res.json();

  const osmtogeojsonModule = await import("osmtogeojson");
  const osmtogeojson = (osmtogeojsonModule.default ??
    osmtogeojsonModule) as (data: unknown) => FeatureCollection;
  const fc = osmtogeojson(osmJson) as FeatureCollection<
    Polygon | MultiPolygon,
    Record<string, unknown>
  >;

  const features: NormalizedFeature[] = [];
  for (const f of fc.features) {
    if (f.geometry?.type !== "Polygon" && f.geometry?.type !== "MultiPolygon") continue;
    const props = f.properties ?? {};
    const name = String(props.name ?? "Unknown");
    const id = String(props["@id"] ?? props.id ?? `${features.length}`);
    features.push({
      type: "Feature",
      geometry: f.geometry,
      properties: { salCode: `osm-${id}`, salName: name },
    });
  }

  if (features.length === 0) {
    throw new Error("Overpass/osmtogeojson returned 0 usable suburb polygons");
  }

  return { type: "FeatureCollection", features };
}
