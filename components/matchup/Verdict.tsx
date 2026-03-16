'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface VerdictProps {
  favoredTeamName: string;
  winPct: number;
  confidence: string;
  verdict: string;
  teamColor: string;
}

/** Animated count-up from 50 → target using requestAnimationFrame. */
function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(50);

  useEffect(() => {
    const targetRound = Math.round(target * 100);
    const startVal = 50;
    const start = performance.now();

    let frame: number;
    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setValue(Math.round(startVal + (targetRound - startVal) * eased));
      if (t < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}

export default function Verdict({
  favoredTeamName,
  winPct,
  confidence,
  verdict,
  teamColor,
}: VerdictProps) {
  const displayPct = useCountUp(winPct);

  return (
    <motion.div
      className="relative overflow-hidden border border-rule bg-surface p-4 sm:p-6 lg:p-8"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Accent bar */}
      <div
        className="absolute left-0 top-0 h-full w-0.5"
        style={{ backgroundColor: teamColor }}
      />

      <div className="flex flex-col gap-4 pl-4 sm:pl-6">
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-sm font-medium uppercase tracking-widest text-ink-muted">
            Our Pick
          </span>
          <span className="border border-rule px-2.5 py-0.5 text-sm text-ink-muted">
            {confidence}
          </span>
        </div>

        <div>
          <div className="flex items-baseline gap-3">
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl" style={{ color: teamColor }}>
              {favoredTeamName}
            </h2>
            <span className="font-mono text-lg sm:text-xl text-ink-muted tabular-nums">
              {displayPct}%
            </span>
          </div>

          {/* Animated underline — draws itself after the team name appears */}
          <motion.div
            className="mt-1.5 h-px"
            style={{ backgroundColor: teamColor, opacity: 0.35 }}
            initial={{ width: 0 }}
            animate={{ width: '40%' }}
            transition={{ duration: 0.6, delay: 0.5, ease: 'easeOut' }}
          />
        </div>

        <p className="text-base italic text-ink-muted leading-relaxed max-w-xl">
          {verdict}
        </p>
      </div>
    </motion.div>
  );
}
