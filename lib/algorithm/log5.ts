function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function log5(pA: number, pB: number): number {
  const a = clamp(pA, 0.01, 0.99);
  const b = clamp(pB, 0.01, 0.99);

  return (a * (1 - b)) / (a * (1 - b) + b * (1 - a));
}
