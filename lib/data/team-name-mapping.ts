/**
 * Maps internal team names to common variations used by prediction market platforms.
 * Used for fuzzy-matching our team names to Polymarket market outcomes.
 */

/** Canonical name → list of known aliases on market platforms */
const NAME_ALIASES: Record<string, string[]> = {
  'UConn':            ['Connecticut', 'UCONN', 'U Conn'],
  'St. John\'s':      ['St Johns', 'Saint Johns', 'St John\'s', 'Saint John\'s'],
  'Saint Mary\'s':    ['St. Mary\'s', 'St Marys', 'Saint Marys'],
  'Miami':            ['Miami FL', 'Miami (FL)', 'Miami Florida', 'Miami Hurricanes'],
  'Miami (OH)':       ['Miami Ohio', 'Miami (Ohio)', 'Miami RedHawks'],
  'NC State':         ['North Carolina State', 'N.C. State', 'NCSU'],
  'UCF':              ['Central Florida'],
  'USC':              ['Southern California', 'Southern Cal'],
  'UCLA':             ['UC Los Angeles'],
  'TCU':              ['Texas Christian'],
  'BYU':              ['Brigham Young'],
  'VCU':              ['Virginia Commonwealth'],
  'SMU':              ['Southern Methodist'],
  'LSU':              ['Louisiana State'],
  'UMBC':             ['Maryland Baltimore County', 'Univ of Maryland Baltimore County'],
  'Long Island':      ['LIU', 'Long Island University', 'LIU Brooklyn', 'LIU Sharks'],
  'Prairie View A&M': ['Prairie View', 'PVAMU'],
  'Texas A&M':        ['Texas A and M', 'Texas AM'],
  'South Florida':    ['USF'],
  'Northern Iowa':    ['UNI'],
  'North Dakota State': ['NDSU'],
  'California Baptist': ['Cal Baptist', 'CBU'],
  'Kennesaw State':   ['Kennesaw St', 'Kennesaw St.', 'KSU'],
  'Utah State':       ['Utah St', 'Utah St.'],
  'Michigan State':   ['Michigan St', 'Michigan St.', 'MSU'],
  'Ohio State':       ['Ohio St', 'Ohio St.', 'OSU'],
  'Iowa State':       ['Iowa St', 'Iowa St.'],
  'Tennessee State':  ['Tennessee St', 'Tennessee St.', 'TSU'],
  'Wright State':     ['Wright St', 'Wright St.'],
  'High Point':       ['HPU'],
  'McNeese':          ['McNeese State', 'McNeese St'],
  'Queens':           ['Queens University'],
};

/**
 * Normalize a team name for comparison: lowercase, strip punctuation, collapse spaces.
 */
function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/['.()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Build a bidirectional lookup between canonical names and aliases.
 * Maps normalized form → canonical name (for both canonical names and aliases).
 */
const toCanonical = new Map<string, string>();
for (const [canonical, aliases] of Object.entries(NAME_ALIASES)) {
  toCanonical.set(normalize(canonical), canonical);
  for (const alias of aliases) {
    toCanonical.set(normalize(alias), canonical);
  }
}

/**
 * Resolve a name (from any source) to its canonical form.
 * Returns the canonical name if found, or the original name if not.
 */
function resolveCanonical(name: string): string {
  return toCanonical.get(normalize(name)) ?? name;
}

/**
 * Try to find which entry in `candidates` refers to the same team as `target`.
 *
 * Works bidirectionally: `target` can be an internal name and `candidates` market names,
 * or vice versa. Both sides are resolved to canonical form before comparison.
 *
 * Returns the matching candidate string (original, not normalized) or null.
 */
export function findMarketMatch(
  target: string,
  candidates: string[],
): string | null {
  const targetCanonical = normalize(resolveCanonical(target));

  // Check each candidate's canonical form against target's canonical form
  for (const candidate of candidates) {
    const candidateCanonical = normalize(resolveCanonical(candidate));
    if (candidateCanonical === targetCanonical) return candidate;
  }

  // Substring match as last resort (e.g., "Duke Blue Devils" contains "Duke")
  for (const candidate of candidates) {
    const n = normalize(candidate);
    if (n.includes(targetCanonical) || targetCanonical.includes(n)) {
      return candidate;
    }
  }

  return null;
}
