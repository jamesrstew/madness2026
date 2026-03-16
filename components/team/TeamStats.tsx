'use client';

import type { TeamStats as TeamStatsType } from '@/lib/types';

interface TeamStatsProps {
  stats: TeamStatsType;
}

interface StatGroup {
  title: string;
  stats: { key: keyof TeamStatsType; label: string; format?: string }[];
}

const STAT_GROUPS: StatGroup[] = [
  {
    title: 'Offense',
    stats: [
      { key: 'adjOE', label: 'Adj. Offensive Eff.' },
      { key: 'ppg', label: 'Points Per Game' },
      { key: 'fgPct', label: 'FG%', format: 'pct' },
      { key: 'fg3Pct', label: '3PT%', format: 'pct' },
      { key: 'ftPct', label: 'FT%', format: 'pct' },
      { key: 'apg', label: 'Assists Per Game' },
    ],
  },
  {
    title: 'Defense',
    stats: [
      { key: 'adjDE', label: 'Adj. Defensive Eff.' },
      { key: 'oppg', label: 'Opp. Points Per Game' },
      { key: 'rpg', label: 'Rebounds Per Game' },
      { key: 'spg', label: 'Steals Per Game' },
      { key: 'bpg', label: 'Blocks Per Game' },
    ],
  },
  {
    title: 'Four Factors',
    stats: [
      { key: 'oEFG', label: 'Off. eFG%', format: 'pct' },
      { key: 'dEFG', label: 'Def. eFG%', format: 'pct' },
      { key: 'oTOV', label: 'Off. TOV%', format: 'pct' },
      { key: 'dTOV', label: 'Def. TOV%', format: 'pct' },
      { key: 'oORB', label: 'Off. Reb%', format: 'pct' },
      { key: 'dORB', label: 'Def. Reb%', format: 'pct' },
      { key: 'oFTR', label: 'Off. FT Rate', format: 'pct' },
      { key: 'dFTR', label: 'Def. FT Rate', format: 'pct' },
    ],
  },
  {
    title: 'Advanced',
    stats: [
      { key: 'adjEM', label: 'Adj. Efficiency Margin' },
      { key: 'tempo', label: 'Tempo' },
      { key: 'sos', label: 'Strength of Schedule' },
    ],
  },
];

function formatValue(value: number, format?: string): string {
  if (format === 'pct') return `${(value * 100).toFixed(1)}%`;
  return value.toFixed(1);
}

export default function TeamStatsDisplay({ stats }: TeamStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
      {STAT_GROUPS.map((group) => (
        <div
          key={group.title}
          className="border border-rule bg-surface p-4 sm:p-5"
        >
          <h4 className="text-xs font-medium uppercase tracking-widest text-ink-faint mb-4 pb-2 border-b border-rule">
            {group.title}
          </h4>
          <div className="space-y-3">
            {group.stats.map(({ key, label, format }) => {
              const value = stats[key];
              if (typeof value !== 'number') return null;
              return (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-ink-muted">{label}</span>
                  <span className="font-mono text-sm font-medium">
                    {formatValue(value, format)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
