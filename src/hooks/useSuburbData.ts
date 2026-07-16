import { useEffect, useState } from "react";
import type { FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { fetchJson } from "@/lib/dataLoader";
import type { SuburbProperties, SuburbStats } from "@/lib/types";

export type SuburbFeatureCollection = FeatureCollection<
  Polygon | MultiPolygon,
  SuburbProperties
>;

export function useSuburbBoundaries() {
  const [data, setData] = useState<SuburbFeatureCollection | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchJson<SuburbFeatureCollection>("/data/generated/suburbs/boundaries.geojson")
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, error };
}

export function useSuburbStats() {
  const [data, setData] = useState<SuburbStats | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchJson<SuburbStats>("/data/generated/suburbs/stats.json")
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, error };
}
