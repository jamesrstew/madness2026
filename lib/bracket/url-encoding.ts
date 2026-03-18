import type { Matchup } from '@/lib/types/bracket';
import { REGIONS } from './structure';

// ---------------------------------------------------------------------------
// Canonical matchup order (matches generateInitialBracket in structure.ts)
// ---------------------------------------------------------------------------

export const MATCHUP_ORDER: string[] = [];

// First Four: 4 play-in games
for (let i = 0; i < 4; i++) {
  MATCHUP_ORDER.push(`FIRST_FOUR-${i}`);
}

// R64: 8 matchups per region
for (const region of REGIONS) {
  for (let i = 0; i < 8; i++) {
    MATCHUP_ORDER.push(`R64-${region}-${i}`);
  }
}

// R32: 4 per region
for (const region of REGIONS) {
  for (let i = 0; i < 4; i++) {
    MATCHUP_ORDER.push(`R32-${region}-${i}`);
  }
}

// S16: 2 per region
for (const region of REGIONS) {
  for (let i = 0; i < 2; i++) {
    MATCHUP_ORDER.push(`S16-${region}-${i}`);
  }
}

// E8: 1 per region
for (const region of REGIONS) {
  MATCHUP_ORDER.push(`E8-${region}-0`);
}

// FF: 2 semifinal games
for (let i = 0; i < 2; i++) {
  MATCHUP_ORDER.push(`FF-${i}`);
}

// Championship
MATCHUP_ORDER.push('CHAMPIONSHIP-0');

// ---------------------------------------------------------------------------
// Basketball word vocabulary (64 words = 6 bits each)
// ---------------------------------------------------------------------------

const HOOPS: string[] = [
  // 0–7: Court
  'rim',   'net',   'arc',   'key',   'lane',  'post',  'paint', 'glass',
  // 8–15: Scoring
  'jam',   'dunk',  'slam',  'swish', 'drain', 'score', 'bank',  'three',
  // 16–23: Passing & movement
  'pass',  'dish',  'lob',   'drive', 'cross', 'spin',  'fade',  'step',
  // 24–31: Defense
  'block', 'steal', 'press', 'zone',  'pick',  'roll',  'pump',  'fake',
  // 32–39: Descriptors
  'deep',  'wet',   'ice',   'hot',   'big',   'fast',  'fly',   'rush',
  // 40–47: Game flow
  'run',   'win',   'ball',  'shot',  'free',  'foul',  'hook',  'pull',
  // 48–55: Flair
  'fire',  'heat',  'rain',  'money', 'clutch','float', 'drop',  'break',
  // 56–63: Extras
  'tip',   'tap',   'cut',   'pop',   'hit',   'sub',   'box',   'ace',
];

// Reverse lookup: word → index
const HOOPS_INDEX = new Map<string, number>();
for (let i = 0; i < HOOPS.length; i++) {
  HOOPS_INDEX.set(HOOPS[i], i);
}

// ---------------------------------------------------------------------------
// Bit helpers
// ---------------------------------------------------------------------------

function getBit(bytes: Uint8Array, bitIndex: number): number {
  const byteIndex = Math.floor(bitIndex / 8);
  if (byteIndex >= bytes.length) return 0;
  return (bytes[byteIndex] >> (7 - (bitIndex % 8))) & 1;
}

function get6Bits(bytes: Uint8Array, startBit: number): number {
  let value = 0;
  for (let i = 0; i < 6; i++) {
    value = (value << 1) | getBit(bytes, startBit + i);
  }
  return value;
}

// ---------------------------------------------------------------------------
// Encode: bracket selections → basketball-word URL string
// ---------------------------------------------------------------------------

/**
 * Pack bracket selections into a basketball-themed word string.
 * Each of the 67 matchups is encoded as 2 bits:
 *   00 = no pick, 01 = team1, 10 = team2
 * 134 bits → 23 six-bit words → hyphen-joined basketball terms
 * e.g. "slam-swish-dunk-three-block-steal-..."
 */
export function encodeBracket(
  selections: Map<string, number>,
  matchups: Map<string, Matchup>,
): string {
  if (selections.size === 0) return '';

  const bits: number[] = [];

  for (const id of MATCHUP_ORDER) {
    const matchup = matchups.get(id);

    // For matchups with final actual results, encode the user's original pick
    // (not the actual winner), so shared URLs represent user predictions only.
    let pickId: number | undefined;
    if (matchup?.actualResult?.status === 'final') {
      pickId = matchup.userPick?.id;
    } else {
      pickId = selections.get(id);
    }

    if (pickId === undefined || !matchup) {
      bits.push(0, 0);
    } else if (matchup.team1 && pickId === matchup.team1.id) {
      bits.push(0, 1); // team1
    } else if (matchup.team2 && pickId === matchup.team2.id) {
      bits.push(1, 0); // team2
    } else {
      bits.push(0, 0);
    }
  }

  // Check if all bits are zero (no valid picks encoded)
  if (bits.every((b) => b === 0)) return '';

  // Pack bits into bytes
  const byteCount = Math.ceil(bits.length / 8);
  const bytes = new Uint8Array(byteCount);
  for (let i = 0; i < bits.length; i++) {
    if (bits[i]) {
      bytes[Math.floor(i / 8)] |= 1 << (7 - (i % 8));
    }
  }

  // Read 6 bits at a time and map to basketball words
  const wordCount = Math.ceil(bits.length / 6);
  const words: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    const value = get6Bits(bytes, i * 6);
    words.push(HOOPS[value]);
  }

  // Trim trailing "rim" (index 0) words that are just zero-padding
  while (words.length > 1 && words[words.length - 1] === HOOPS[0]) {
    words.pop();
  }

  return words.join('-');
}

// ---------------------------------------------------------------------------
// Decode: basketball-word string → matchup selections
// ---------------------------------------------------------------------------

/**
 * Unpack a basketball-word bracket string into a map of matchup picks.
 * Returns an empty map on any error (corrupted input, unknown words).
 */
export function decodeBracket(encoded: string): Map<string, 'team1' | 'team2'> {
  const result = new Map<string, 'team1' | 'team2'>();
  if (!encoded) return result;

  try {
    const words = encoded.split('-');

    // Convert words back to 6-bit values and pack into bytes
    const totalBits = words.length * 6;
    const byteCount = Math.ceil(totalBits / 8);
    const bytes = new Uint8Array(byteCount);

    for (let w = 0; w < words.length; w++) {
      const idx = HOOPS_INDEX.get(words[w]);
      if (idx === undefined) return new Map(); // unknown word → bail

      // Write 6 bits starting at bit position w*6
      for (let b = 0; b < 6; b++) {
        if ((idx >> (5 - b)) & 1) {
          const bitPos = w * 6 + b;
          bytes[Math.floor(bitPos / 8)] |= 1 << (7 - (bitPos % 8));
        }
      }
    }

    // Extract 2-bit pairs for each matchup
    for (let i = 0; i < MATCHUP_ORDER.length; i++) {
      const bit1 = getBit(bytes, i * 2);
      const bit2 = getBit(bytes, i * 2 + 1);

      if (bit1 === 0 && bit2 === 1) {
        result.set(MATCHUP_ORDER[i], 'team1');
      } else if (bit1 === 1 && bit2 === 0) {
        result.set(MATCHUP_ORDER[i], 'team2');
      }
      // 00 = no pick, 11 = invalid → skip
    }
  } catch {
    return new Map();
  }

  return result;
}

// ---------------------------------------------------------------------------
// URL helpers
// ---------------------------------------------------------------------------

/** Read the `?b=` query parameter from the current URL. */
export function getBracketFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get('b');
}

/** Update the `?b=` query parameter via replaceState (no navigation). */
export function setBracketInUrl(encoded: string): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (encoded) {
    url.searchParams.set('b', encoded);
  } else {
    url.searchParams.delete('b');
  }
  history.replaceState(null, '', url.toString());
}
