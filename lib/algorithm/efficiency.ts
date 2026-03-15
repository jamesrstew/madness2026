export interface AdjustedEfficiency {
  adjOE: number;
  adjDE: number;
  adjEM: number;
}

export function calculateAdjustedEfficiency(
  rawOE: number,
  rawDE: number,
  avgOE: number,
  avgDE: number,
): AdjustedEfficiency {
  const adjOE = rawOE - avgOE;
  const adjDE = rawDE - avgDE;
  const adjEM = adjOE - adjDE;
  return { adjOE, adjDE, adjEM };
}

export function efficiencyMargin(adjOE: number, adjDE: number): number {
  return adjOE - adjDE;
}
