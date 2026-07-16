const cache = new Map<string, Promise<unknown>>();

function getCached<T>(url: string, loader: () => Promise<T>): Promise<T> {
  let entry = cache.get(url) as Promise<T> | undefined;
  if (!entry) {
    entry = loader().catch((err: unknown) => {
      cache.delete(url);
      throw err;
    });
    cache.set(url, entry);
  }
  return entry;
}

export function fetchJson<T>(url: string): Promise<T> {
  return getCached(url, async () => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}: HTTP ${res.status}`);
    return (await res.json()) as T;
  });
}

export function fetchArrayBuffer(url: string): Promise<ArrayBuffer> {
  return getCached(url, async () => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}: HTTP ${res.status}`);
    return await res.arrayBuffer();
  });
}
