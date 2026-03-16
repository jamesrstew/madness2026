'use client';

import { useState, useEffect } from 'react';

function getColumns(): number {
  if (typeof window === 'undefined') return 2;
  const w = window.innerWidth;
  if (w >= 1280) return 4;
  if (w >= 1024) return 3;
  return 2;
}

/**
 * Returns a responsive column count:
 *   < 1024px  → 2 columns
 *   1024–1279 → 3 columns
 *   ≥ 1280    → 4 columns
 *
 * SSR-safe: defaults to 2 and recalculates in useEffect.
 */
export function useBreakpointColumns(): number {
  const [cols, setCols] = useState(2);

  useEffect(() => {
    setCols(getColumns());

    const mq1024 = window.matchMedia('(min-width: 1024px)');
    const mq1280 = window.matchMedia('(min-width: 1280px)');

    const update = () => setCols(getColumns());
    mq1024.addEventListener('change', update);
    mq1280.addEventListener('change', update);

    return () => {
      mq1024.removeEventListener('change', update);
      mq1280.removeEventListener('change', update);
    };
  }, []);

  return cols;
}
