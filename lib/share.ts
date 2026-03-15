/**
 * Bracket sharing utilities.
 * Encodes bracket selections into a compact base64 string for URL sharing.
 */

export function encodeBracket(selections: Map<string, number>): string {
  // Sort keys for deterministic encoding
  const entries = Array.from(selections.entries()).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  // Pack as JSON-compact format: alternating key,value pairs
  const packed = entries.flatMap(([key, val]) => [key, String(val)]);
  const json = JSON.stringify(packed);

  // Base64 encode
  if (typeof window !== 'undefined') {
    return btoa(json);
  }
  return Buffer.from(json).toString('base64');
}

export function decodeBracket(encoded: string): Map<string, number> {
  let json: string;
  if (typeof window !== 'undefined') {
    json = atob(encoded);
  } else {
    json = Buffer.from(encoded, 'base64').toString('utf-8');
  }

  const packed: string[] = JSON.parse(json);
  const map = new Map<string, number>();

  for (let i = 0; i < packed.length; i += 2) {
    map.set(packed[i], Number(packed[i + 1]));
  }

  return map;
}

export function getShareUrl(selections: Map<string, number>): string {
  const encoded = encodeBracket(selections);
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href);
    url.pathname = '/bracket';
    url.searchParams.set('bracket', encoded);
    return url.toString();
  }
  return `?bracket=${encoded}`;
}
