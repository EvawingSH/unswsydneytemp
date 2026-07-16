import { useEffect, useState } from "react";
import { fetchJson } from "@/lib/dataLoader";
import type { Meta } from "@/lib/types";

export function useMetaData() {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchJson<Meta>("/data/generated/meta.json")
      .then((m) => {
        if (!cancelled) setMeta(m);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { meta, error };
}
