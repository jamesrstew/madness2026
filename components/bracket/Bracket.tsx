'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Region as RegionType, Matchup } from '@/lib/types';
import { useBracket } from '@/lib/bracket/state';
import { REGIONS } from '@/lib/bracket/structure';
import Region from './Region';
import FirstFour from './FirstFour';
import FinalFour from './FinalFour';

type Tab = RegionType | 'Final Four';

function getFirstFourMatchups(matchups: Map<string, Matchup>): Matchup[] {
  const result: Matchup[] = [];
  for (const [, m] of matchups) {
    if (m.round === 'FIRST_FOUR') result.push(m);
  }
  result.sort((a, b) => a.id.localeCompare(b.id));
  return result;
}

export default function Bracket() {
  const { state, dispatch } = useBracket();
  const [activeTab, setActiveTab] = useState<Tab>('East');

  const handleSelectWinner = (matchupId: string, teamId: number) => {
    const matchup = state.matchups.get(matchupId);
    if (!matchup) return;
    const winner = matchup.team1?.id === teamId ? matchup.team1 : matchup.team2;
    if (!winner) return;
    dispatch({ type: 'SELECT_WINNER', matchupId, winner });
  };

  const handleAutoFill = () => dispatch({ type: 'AUTO_FILL' });
  const handleReset = () => {
    // Rebuild empty matchups from current structure (keep teams in R64)
    const matchups: Matchup[] = [];
    for (const [, m] of state.matchups) {
      if (m.round === 'R64' || m.round === 'FIRST_FOUR') {
        matchups.push({ ...m, winner: undefined });
      } else {
        matchups.push({ id: m.id, round: m.round, region: m.region });
      }
    }
    dispatch({ type: 'RESET_BRACKET', matchups });
  };

  const firstFourMatchups = getFirstFourMatchups(state.matchups);
  const tabs: Tab[] = [...REGIONS, 'Final Four'];

  return (
    <div className="flex flex-col gap-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={handleAutoFill}
          className="rounded-lg bg-tournament-orange px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-tournament-orange-light"
        >
          Auto-fill Bracket
        </button>
        <button
          onClick={handleReset}
          className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          Reset
        </button>
        <div className="ml-auto flex items-center gap-2">
          <div className="h-2 w-32 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-tournament-orange"
              initial={{ width: 0 }}
              animate={{ width: `${state.completionPct}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <span className="text-sm text-white/50">{state.completionPct}%</span>
        </div>
      </div>

      {/* First Four */}
      {firstFourMatchups.length > 0 && (
        <FirstFour matchups={firstFourMatchups} onSelectWinner={handleSelectWinner} />
      )}

      {/* Desktop layout (>=1280px): CSS grid with all regions */}
      <div className="hidden xl:grid xl:grid-cols-[1fr_auto_1fr] xl:gap-6">
        {/* Left column: East + West */}
        <div className="flex flex-col gap-8">
          {(['East', 'West'] as RegionType[]).map((r) => (
            <Region key={r} region={r} matchups={state.matchups} onSelectWinner={handleSelectWinner} />
          ))}
        </div>

        {/* Center: Final Four + Championship */}
        <FinalFour matchups={state.matchups} onSelectWinner={handleSelectWinner} />

        {/* Right column: South + Midwest */}
        <div className="flex flex-col gap-8">
          {(['South', 'Midwest'] as RegionType[]).map((r) => (
            <Region key={r} region={r} matchups={state.matchups} onSelectWinner={handleSelectWinner} />
          ))}
        </div>
      </div>

      {/* Mobile layout (<1280px): Tabs */}
      <div className="xl:hidden">
        <div className="mb-4 flex gap-1 overflow-x-auto rounded-lg bg-white/5 p-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-tournament-orange text-white'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'Final Four' ? (
              <FinalFour matchups={state.matchups} onSelectWinner={handleSelectWinner} />
            ) : (
              <Region region={activeTab} matchups={state.matchups} onSelectWinner={handleSelectWinner} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
