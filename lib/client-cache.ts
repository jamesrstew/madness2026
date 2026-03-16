/**
 * Lightweight client-side fetch wrapper with sessionStorage caching.
 * Prevents redundant API calls when navigating back to pages already visited.
 */

const memoryCache = new Map<string, { data: unknown; expiresAt: number }>();

const DEFAULT_TTL = 30 * 60 * 1000; // 30 minutes

export async function cachedClientFetch<T>(
  url: string,
  options?: RequestInit & { ttl?: number },
): Promise<T> {
  const ttl = options?.ttl ?? DEFAULT_TTL;
  const cacheKey = options?.body ? `${url}:${options.body}` : url;

  // Check memory cache first (survives SPA navigations)
  const mem = memoryCache.get(cacheKey);
  if (mem && Date.now() < mem.expiresAt) {
    return mem.data as T;
  }

  // Check sessionStorage (survives full page reloads within tab)
  try {
    const stored = sessionStorage.getItem(cacheKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.expiresAt > Date.now()) {
        memoryCache.set(cacheKey, parsed);
        return parsed.data as T;
      }
      sessionStorage.removeItem(cacheKey);
    }
  } catch {
    // sessionStorage unavailable (SSR, private browsing, etc.)
  }

  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

  const data: T = await res.json();
  const entry = { data, expiresAt: Date.now() + ttl };

  memoryCache.set(cacheKey, entry);
  try {
    sessionStorage.setItem(cacheKey, JSON.stringify(entry));
  } catch {
    // Storage full or unavailable — memory cache still works
  }

  return data;
}
