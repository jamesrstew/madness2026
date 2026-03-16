import type { Team } from './types/team';

/** Parse a hex color string (#RRGGBB or RRGGBB) into [R, G, B]. */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.startsWith('#') ? hex.slice(1) : hex;
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/** Convert RGB to HSL. Returns [h: 0-360, s: 0-1, l: 0-1]. */
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s, l];
}

/**
 * Euclidean distance between two colors in RGB space.
 * Range: 0 (identical) to ~441 (black vs white).
 */
function colorDistance(a: string, b: string): number {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

/**
 * Perceptual similarity check that catches cases RGB distance misses.
 * Two dark/saturated colors with similar hue look alike on a small bar
 * even when their RGB distance is above the basic threshold.
 */
function areTooSimilar(a: string, b: string): boolean {
  // Basic RGB distance check (raised from 80 to 110)
  if (colorDistance(a, b) < 110) return true;

  // Hue proximity check for dark or saturated colors
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const [h1, s1, l1] = rgbToHsl(r1, g1, b1);
  const [h2, s2, l2] = rgbToHsl(r2, g2, b2);

  // Very dark colors (L < 0.20) all look near-black on a thin bar,
  // regardless of hue — if BOTH are very dark, they're too similar.
  // (brightenIfNeeded lifts these before comparison, but this catches raw values)
  if (l1 < 0.20 && l2 < 0.20) return true;

  // Both colors are chromatic (saturation > 0.15)
  const bothChromatic = s1 > 0.15 && s2 > 0.15;
  // Both are dark (lightness < 0.45) or both are mid-range
  const bothDark = l1 < 0.45 && l2 < 0.45;
  const bothMid = l1 >= 0.3 && l1 <= 0.6 && l2 >= 0.3 && l2 <= 0.6;

  if (bothChromatic && (bothDark || bothMid)) {
    // Hue distance on the 360° wheel
    let hueDiff = Math.abs(h1 - h2);
    if (hueDiff > 180) hueDiff = 360 - hueDiff;
    // Close hue + similar lightness → looks the same on a thin bar
    if (hueDiff < 55 && Math.abs(l1 - l2) < 0.25) return true;
  }

  return false;
}

/** Light background color — team colors too close to this get darkened. */
const LIGHT_BG = '#FAFAF7';
const LIGHT_THRESHOLD = 100;

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

/** Darken a color that would be invisible on the light paper background. */
function ensureContrast(color: string): string {
  if (colorDistance(color, LIGHT_BG) < LIGHT_THRESHOLD) {
    const [r, g, b] = hexToRgb(color);
    return rgbToHex(Math.round(r * 0.6), Math.round(g * 0.6), Math.round(b * 0.6));
  }
  return color;
}

/**
 * Shift a color's hue by rotating it in HSL space, returning a new hex color.
 * Used as a last resort to create a visually distinct variant.
 */
function shiftHue(hex: string, degrees: number): string {
  const [r, g, b] = hexToRgb(hex);
  const [h, s, l] = rgbToHsl(r, g, b);
  const newH = ((h + degrees) % 360 + 360) % 360;
  // HSL → RGB
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((newH / 60) % 2) - 1));
  const m = l - c / 2;
  let rr = 0, gg = 0, bb = 0;
  if (newH < 60)       { rr = c; gg = x; }
  else if (newH < 120) { rr = x; gg = c; }
  else if (newH < 180) { gg = c; bb = x; }
  else if (newH < 240) { gg = x; bb = c; }
  else if (newH < 300) { rr = x; bb = c; }
  else                 { rr = c; bb = x; }
  return rgbToHex(
    Math.round((rr + m) * 255),
    Math.round((gg + m) * 255),
    Math.round((bb + m) * 255),
  );
}

/** Convert HSL to hex. h: 0-360, s: 0-1, l: 0-1 */
function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let rr = 0, gg = 0, bb = 0;
  if (h < 60)       { rr = c; gg = x; }
  else if (h < 120) { rr = x; gg = c; }
  else if (h < 180) { gg = c; bb = x; }
  else if (h < 240) { gg = x; bb = c; }
  else if (h < 300) { rr = x; bb = c; }
  else              { rr = c; bb = x; }
  return rgbToHex(
    Math.round((rr + m) * 255),
    Math.round((gg + m) * 255),
    Math.round((bb + m) * 255),
  );
}

/**
 * Brighten a near-black color so its hue is visible.
 * E.g. UConn #000E2F (navy, L=0.09) → a visible navy blue at L=0.30.
 */
function brightenIfNeeded(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  const [h, s, l] = rgbToHsl(r, g, b);
  if (l < 0.20) {
    // Boost lightness to 0.32, keep the hue and saturate enough to show it
    return hslToHex(h, Math.max(s, 0.6), 0.32);
  }
  return hex;
}

/**
 * Given two teams, return display colors that are visually distinct.
 *
 * Uses perceptual similarity (RGB distance + hue proximity for dark colors)
 * to catch cases like navy-vs-purple or red-vs-burnt-orange.
 *
 * Near-black primaries (L < 0.15) are brightened to reveal their hue before
 * comparison — otherwise they all look like "black" on a thin bar.
 *
 * Fallback cascade:
 *   1. Primary vs primary (brightened if near-black)
 *   2. Primary vs team2 alternate
 *   3. Team1 alternate vs primary
 *   4. Both alternates
 *   5. Hue-shifted variant of team2's primary
 *   6. Hard-coded contrasting defaults
 */
export function resolveTeamColors(
  team1: Team,
  team2: Team,
): { team1Color: string; team2Color: string } {
  // Brighten near-black primaries so their hue is actually visible
  const c1 = brightenIfNeeded(ensureHash(team1.color));
  const c2 = brightenIfNeeded(ensureHash(team2.color));
  const alt1 = ensureHash(team1.alternateColor);
  const alt2 = ensureHash(team2.alternateColor);

  // Primary colors are distinct enough — use them
  if (!areTooSimilar(c1, c2)) {
    return { team1Color: ensureContrast(c1), team2Color: ensureContrast(c2) };
  }

  // Try team2's alternate color (skip if it's white/near-white — useless on a light bg)
  if (!isNearWhite(alt2) && !areTooSimilar(c1, alt2)) {
    return { team1Color: ensureContrast(c1), team2Color: ensureContrast(alt2) };
  }

  // Try team1's alternate color
  if (!isNearWhite(alt1) && !areTooSimilar(alt1, c2)) {
    return { team1Color: ensureContrast(alt1), team2Color: ensureContrast(c2) };
  }

  // Both alternates (if neither is white)
  if (!isNearWhite(alt1) && !isNearWhite(alt2) && !areTooSimilar(alt1, alt2)) {
    return { team1Color: ensureContrast(alt1), team2Color: ensureContrast(alt2) };
  }

  // Hue-shift: rotate team2's primary color by 120° to create a distinct variant
  const shifted = shiftHue(c2, 120);
  if (!areTooSimilar(c1, shifted)) {
    return { team1Color: ensureContrast(c1), team2Color: ensureContrast(shifted) };
  }

  // Hard fallback: manually chosen contrasting colors
  return { team1Color: '#2D6A3F', team2Color: '#8B6914' };
}

/** Returns true if a color is near-white (useless as a bar/border color on light backgrounds). */
function isNearWhite(hex: string): boolean {
  const [r, g, b] = hexToRgb(hex);
  return r > 230 && g > 230 && b > 230;
}

function ensureHash(color: string): string {
  return color.startsWith('#') ? color : `#${color}`;
}
