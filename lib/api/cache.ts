interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

export const CBBD_TTL = 12 * 60 * 60 * 1000; // 12 hours
export const ESPN_SCORES_TTL = 5 * 60 * 1000; // 5 minutes
export const ESPN_TEAMS_TTL = 6 * 60 * 60 * 1000; // 6 hours

export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number,
): Promise<T> {
  const existing = cache.get(key) as CacheEntry<T> | undefined;
  if (existing && Date.now() < existing.expiresAt) {
    return existing.data;
  }

  const data = await fetcher();
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
  return data;
}
