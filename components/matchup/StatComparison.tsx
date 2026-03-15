'use client';

import type { TeamStats } from '@/lib/types';

interface StatComparisonProps {
  team1Name: string;
  team2Name: string;
  team1Stats: TeamStats;
  team2Stats: TeamStats;
  statKeys: { key: keyof TeamStats; label: string; higherIsBetter: boolean }[];
}

export default function StatComparison({
  team1Name,
  team2Name,
  team1Stats,
  team2Stats,
  statKeys,
}: StatComparisonProps) {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
        <span>{team1Name}</span>
        <span>Stat</span>
        <span>{team2Name}</span>
      </div>

      <div className="space-y-3">
        {statKeys.map(({ key, label, higherIsBetter }) => {
          const v1 = team1Stats[key] as number;
          const v2 = team2Stats[key] as number;
          const team1Better = higherIsBetter ? v1 > v2 : v1 < v2;
          const team2Better = higherIsBetter ? v2 > v1 : v2 < v1;

          return (
            <div key={key} className="flex items-center gap-3">
              <span
                className={`w-16 text-right text-sm font-semibold ${
                  team1Better ? 'text-court-green' : team2Better ? 'text-danger-red' : 'text-gray-300'
                }`}
              >
                {typeof v1 === 'number' ? v1.toFixed(1) : v1}
              </span>

              {/* Bar visualization */}
              <div className="flex-1">
                <div className="relative flex h-2 rounded-full bg-white/5">
                  <div
                    className={`h-full rounded-l-full transition-all ${
                      team1Better ? 'bg-court-green' : 'bg-danger-red'
                    }`}
                    style={{
                      width: `${(v1 / (v1 + v2)) * 100}%`,
                    }}
                  />
                  <div
                    className={`h-full rounded-r-full transition-all ${
                      team2Better ? 'bg-court-green' : 'bg-danger-red'
                    }`}
                    style={{
                      width: `${(v2 / (v1 + v2)) * 100}%`,
                    }}
                  />
                </div>
                <div className="text-center text-xs text-gray-500 mt-1">
                  {label}
                </div>
              </div>

              <span
                className={`w-16 text-left text-sm font-semibold ${
                  team2Better ? 'text-court-green' : team1Better ? 'text-danger-red' : 'text-gray-300'
                }`}
              >
                {typeof v2 === 'number' ? v2.toFixed(1) : v2}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
