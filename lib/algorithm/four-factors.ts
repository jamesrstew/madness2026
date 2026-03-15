export interface RawBoxStats {
  fgm: number;
  fga: number;
  fg3m: number;
  fta: number;
  tov: number;
  orb: number;
  oppDrb: number;
  // Defensive counterparts
  oppFgm: number;
  oppFga: number;
  oppFg3m: number;
  oppFta: number;
  oppTov: number;
  oppOrb: number;
  drb: number;
}

export interface FourFactorsResult {
  oEFG: number;
  dEFG: number;
  oTOV: number;
  dTOV: number;
  oORB: number;
  dORB: number;
  oFTR: number;
  dFTR: number;
}

export function calculateFourFactors(stats: RawBoxStats): FourFactorsResult {
  const oEFG = stats.fga > 0
    ? (stats.fgm + 0.5 * stats.fg3m) / stats.fga
    : 0;

  const dEFG = stats.oppFga > 0
    ? (stats.oppFgm + 0.5 * stats.oppFg3m) / stats.oppFga
    : 0;

  const oPoss = stats.fga + 0.44 * stats.fta + stats.tov;
  const oTOV = oPoss > 0 ? stats.tov / oPoss : 0;

  const dPoss = stats.oppFga + 0.44 * stats.oppFta + stats.oppTov;
  const dTOV = dPoss > 0 ? stats.oppTov / dPoss : 0;

  const oORB = (stats.orb + stats.oppDrb) > 0
    ? stats.orb / (stats.orb + stats.oppDrb)
    : 0;

  const dORB = (stats.oppOrb + stats.drb) > 0
    ? stats.oppOrb / (stats.oppOrb + stats.drb)
    : 0;

  const oFTR = stats.fga > 0 ? stats.fta / stats.fga : 0;
  const dFTR = stats.oppFga > 0 ? stats.oppFta / stats.oppFga : 0;

  return { oEFG, dEFG, oTOV, dTOV, oORB, dORB, oFTR, dFTR };
}
