import { useEffect, useState } from "react";
import type { FeatureCollection, Polygon } from "geojson";
import { fetchJson } from "@/lib/dataLoader";
import type { DateId, HexProperties } from "@/lib/types";

export type HexFeatureCollection = FeatureCollection<Polygon, HexProperties>;

export function useHexData(dateId: DateId, resolution: number) {
  const [data, setData] = useState<HexFeatureCollection | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    fetchJson<HexFeatureCollection>(`/data/generated/hex/hex-${dateId}-res${resolution}.geojson`)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e);
      });
    return () => {
      cancelled = true;
    };
  }, [dateId, resolution]);

  return { data, error };
}
