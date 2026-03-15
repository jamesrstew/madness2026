'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const stats = [
  { value: '10,000+', label: 'Simulations' },
  { value: '10', label: 'Prediction Factors' },
  { value: '68', label: 'Teams' },
];

const features = [
  {
    icon: '\u{1F4CA}',
    title: 'Multi-Factor Model',
    desc: '10 weighted factors including adjusted efficiency, four factors, strength of schedule, and recent form with exponential decay.',
  },
  {
    icon: '\u{1F3C0}',
    title: 'Matchup Analysis',
    desc: 'Deep stat comparisons with tempo mismatch detection, rebounding battles, and turnover analysis. FiveThirtyEight-style win probabilities.',
  },
  {
    icon: '\u{1F3AF}',
    title: 'Smart Auto-Fill',
    desc: "One click fills your entire bracket using our prediction engine. Override any pick \u2014 it\u2019s your bracket, we just crunch the numbers.",
  },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-20">
      {/* Hero */}
      <motion.div
        className="text-center"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.h1
          className="text-6xl font-extrabold tracking-tight"
          variants={fadeUp}
        >
          <span className="text-tournament-orange">March</span> Madness 2026
        </motion.h1>
        <motion.p
          className="mt-4 text-xl text-gray-400 max-w-2xl mx-auto"
          variants={fadeUp}
        >
          Build your bracket with algorithm-powered predictions. Our multi-factor
          model analyzes efficiency, tempo, recent form, and matchup edges to
          give you the smartest picks.
        </motion.p>
        <motion.div className="mt-10 flex justify-center gap-4" variants={fadeUp}>
          <Link
            href="/bracket"
            className="rounded-lg bg-tournament-orange px-8 py-3 text-lg font-semibold text-white hover:bg-tournament-orange-light transition-colors"
          >
            Build Your Bracket
          </Link>
        </motion.div>
      </motion.div>

      {/* Animated stat counters */}
      <motion.div
        className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-50px' }}
      >
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            className="rounded-xl bg-navy p-8 border border-white/10"
            variants={fadeUp}
          >
            <div className="text-4xl font-extrabold text-tournament-orange">
              {stat.value}
            </div>
            <div className="mt-2 text-sm text-gray-400 uppercase tracking-wider">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Feature cards */}
      <motion.div
        className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-50px' }}
      >
        {features.map((f) => (
          <motion.div
            key={f.title}
            className="rounded-xl bg-navy p-6 border border-white/10"
            variants={fadeUp}
          >
            <div className="text-3xl mb-3">{f.icon}</div>
            <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
            <p className="text-gray-400 text-sm">{f.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
