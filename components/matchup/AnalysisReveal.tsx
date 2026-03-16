'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Confidence } from '@/lib/types';
import Verdict from './Verdict';
import WinProbability from './WinProbability';

/* ── Analysis step labels ────────────────────────────────── */
function getSteps(t1: string, t2: string, marketAvailable?: boolean) {
  const steps = [
    `Loading ${t1} season data`,
    `Loading ${t2} season data`,
    'Analyzing offensive efficiency',
    'Evaluating defensive metrics',
    'Comparing strength of schedule',
    'Checking coaching tournament records',
    'Assessing tempo & style matchup',
    'Calculating travel distance to venue',
  ];

  if (marketAvailable) {
    steps.push('Fetching prediction market odds');
  }

  steps.push('Running 10,000 simulations');

  if (marketAvailable) {
    steps.push('Blending model with market signal');
  }

  steps.push('Computing win probability');
  return steps;
}

const STEP_MS = 200;
const COMPUTE_MS = 1500;

/* ── Types ───────────────────────────────────────────────── */
interface AnalysisRevealProps {
  predictionLoading: boolean;
  hasPrediction: boolean;
  // Verdict
  favoredTeamName: string;
  favoredWinPct: number;
  favoredColor: string;
  confidence: Confidence;
  verdict: string;
  // WinProbability
  team1Name: string;
  team2Name: string;
  team1Color: string;
  team2Color: string;
  team1WinPct: number;
  // Market data
  marketAvailable?: boolean;
}

type Phase = 'analyzing' | 'computing' | 'revealed';

/* ── Component ───────────────────────────────────────────── */
export default function AnalysisReveal({
  predictionLoading,
  hasPrediction,
  favoredTeamName,
  favoredWinPct,
  favoredColor,
  confidence,
  verdict,
  team1Name,
  team2Name,
  team1Color,
  team2Color,
  team1WinPct,
  marketAvailable,
}: AnalysisRevealProps) {
  const steps = getSteps(team1Name, team2Name, marketAvailable);
  const [phase, setPhase] = useState<Phase>('analyzing');
  const [completedSteps, setCompletedSteps] = useState(0);
  const [scramble, setScramble] = useState(50);
  /* ── Step advancement ─────────────────────────────────── */
  useEffect(() => {
    if (phase !== 'analyzing' || completedSteps >= steps.length) return;
    const id = setTimeout(() => setCompletedSteps((n) => n + 1), STEP_MS);
    return () => clearTimeout(id);
  }, [phase, completedSteps, steps.length]);

  /* ── Analyzing → computing (or revealed on failure) ──── */
  useEffect(() => {
    if (phase !== 'analyzing') return;
    if (completedSteps < steps.length) return;
    if (predictionLoading) return;

    const next: Phase = hasPrediction ? 'computing' : 'revealed';
    const id = setTimeout(() => setPhase(next), 400);
    return () => clearTimeout(id);
  }, [phase, completedSteps, steps.length, predictionLoading, hasPrediction]);

  /* ── Number scramble ──────────────────────────────────── */
  useEffect(() => {
    if (phase !== 'computing') return;
    const target = Math.round(favoredWinPct * 100);
    const start = Date.now();

    const id = setInterval(() => {
      const t = Math.min((Date.now() - start) / COMPUTE_MS, 1);

      if (t < 0.5) {
        // Wide exploration
        setScramble(50 + Math.floor(Math.random() * 35));
      } else if (t < 0.82) {
        // Narrowing
        const factor = (t - 0.5) / 0.32;
        const range = 14 * (1 - factor);
        setScramble(
          Math.round(
            Math.max(50, Math.min(95, target + (Math.random() - 0.5) * range * 2)),
          ),
        );
      } else {
        // Near-target flicker
        const factor = (t - 0.82) / 0.18;
        const range = 3 * (1 - factor);
        setScramble(
          Math.round(
            Math.max(50, Math.min(95, target + (Math.random() - 0.5) * range * 2)),
          ),
        );
      }

      if (t >= 1) {
        clearInterval(id);
        setScramble(target);
        setTimeout(() => setPhase('revealed'), 350);
      }
    }, 55);

    return () => clearInterval(id);
  }, [phase, favoredWinPct]);

  /* ── Progress bar percentage ───────────────────────────── */
  const progressPct =
    phase === 'analyzing'
      ? (completedSteps / steps.length) * 85
      : phase === 'computing'
        ? 85 + 15 * Math.min((scramble - 50) / 40, 1)
        : 100;

  /* ── Render ────────────────────────────────────────────── */
  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {/* ──────── ANALYSIS CARD ──────── */}
        {phase !== 'revealed' ? (
          <motion.div
            key="analysis-card"
            className="relative overflow-hidden border border-rule bg-surface"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.25 } }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 pt-5 pb-3">
              <div className="flex items-center gap-3">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-old-gold opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-old-gold" />
                </span>
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-muted">
                  AI Analysis
                </span>
              </div>

            </div>

            {/* Inner content crossfade */}
            <AnimatePresence mode="wait">
              {phase === 'analyzing' && (
                <motion.div
                  key="steps"
                  className="px-4 sm:px-6 pb-5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                >
                  <div className="space-y-1">
                    {steps.map((step, i) => {
                      const done = i < completedSteps;
                      const active = i === completedSteps && completedSteps < steps.length;
                      const pending = i > completedSteps;

                      return (
                        <motion.div
                          key={step}
                          className="flex items-center gap-2.5 font-mono text-[13px] leading-relaxed"
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: pending ? 0.2 : 1, x: 0 }}
                          transition={{ duration: 0.15, delay: i * 0.03 }}
                        >
                          {/* Status icon */}
                          <span
                            className={`w-4 text-center text-xs ${
                              done
                                ? 'text-sage'
                                : active
                                  ? 'text-old-gold'
                                  : 'text-ink-faint'
                            }`}
                          >
                            {done ? (
                              <motion.span
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{
                                  type: 'spring',
                                  stiffness: 500,
                                  damping: 15,
                                }}
                              >
                                ✓
                              </motion.span>
                            ) : active ? (
                              '›'
                            ) : (
                              '·'
                            )}
                          </span>

                          {/* Label */}
                          <span
                            className={
                              done
                                ? 'text-ink-muted'
                                : active
                                  ? 'text-ink'
                                  : 'text-ink-faint'
                            }
                          >
                            {step}
                            {active && '...'}
                          </span>

                          {/* Blinking cursor for active step */}
                          {active && (
                            <motion.span
                              className="inline-block h-3.5 w-px bg-old-gold"
                              animate={{ opacity: [1, 0] }}
                              transition={{
                                duration: 0.6,
                                repeat: Infinity,
                                repeatType: 'reverse',
                              }}
                            />
                          )}
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Waiting indicator (all steps done, data still loading) */}
                  {completedSteps >= steps.length && predictionLoading && (
                    <motion.p
                      className="mt-3 font-mono text-xs text-ink-faint italic"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      Finalizing analysis
                      <motion.span
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                      >
                        ...
                      </motion.span>
                    </motion.p>
                  )}
                </motion.div>
              )}

              {phase === 'computing' && (
                <motion.div
                  key="computing"
                  className="flex flex-col items-center gap-3 px-4 sm:px-6 pb-6 pt-4"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                  transition={{ duration: 0.25 }}
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-faint">
                    Win Probability
                  </p>

                  {/* Scrambling number */}
                  <div className="relative flex items-center justify-center">
                    {/* Orbiting arc */}
                    <motion.div
                      className="absolute h-24 w-24 rounded-full border border-transparent"
                      style={{ borderTopColor: `${favoredColor}25` }}
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                    />
                    <div className="flex items-baseline gap-0.5">
                      <motion.span
                        className="font-display text-4xl sm:text-5xl lg:text-6xl tabular-nums"
                        style={{ color: favoredColor }}
                        key={scramble}
                        animate={{ opacity: [0.6, 1] }}
                        transition={{ duration: 0.04 }}
                      >
                        {scramble}
                      </motion.span>
                      <span className="font-display text-2xl text-ink-muted">
                        %
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-ink-muted">{favoredTeamName}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Progress bar */}
            <div className="h-[2px] w-full bg-ink/[0.04]">
              <motion.div
                className="h-full bg-old-gold/70"
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
            </div>
          </motion.div>
        ) : (
          /* ──────── REVEALED STATE ──────── */
          <motion.div
            key="verdict-reveal"
            className="space-y-6"
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.35 } },
            }}
          >
            {hasPrediction && (
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 18, scale: 0.98 },
                  show: {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: {
                      duration: 0.5,
                      ease: [0.22, 1, 0.36, 1],
                    },
                  },
                }}
              >
                <Verdict
                  favoredTeamName={favoredTeamName}
                  winPct={favoredWinPct}
                  confidence={confidence}
                  verdict={verdict}
                  teamColor={favoredColor}
                />
              </motion.div>
            )}

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 12 },
                show: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.4 },
                },
              }}
            >
              <WinProbability
                team1Name={team1Name}
                team2Name={team2Name}
                team1Color={team1Color}
                team2Color={team2Color}
                team1WinPct={team1WinPct}
                confidence={confidence}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
