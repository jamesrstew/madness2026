'use client';

import { motion } from 'framer-motion';

const FACTOR_DESCRIPTIONS: Record<string, string> = {
  'Overall Rating':
    'A combined score (0\u2013100) that blends offense, defense, and schedule strength. Higher means a better all-around team.',
  'Offensive Rating':
    'How efficiently a team scores. Based on points per possession, shooting percentages, and ability to create good shots.',
  'Defensive Rating':
    'How well a team prevents the opponent from scoring. Accounts for opponent shooting, turnovers forced, and rim protection. Higher is better here.',
  'Adj. Efficiency Margin':
    'The gap between how many points a team scores vs. allows per 100 possessions, adjusted for opponent quality. A bigger number means a more dominant team.',
  'Strength of Schedule':
    'How tough a team\'s opponents have been this season. A higher number means they\'ve faced stronger competition, so their wins carry more weight.',
  'Tempo mismatch':
    'When a fast-paced team faces a slow-paced team, the faster team tends to dictate the game\'s rhythm and gain an advantage.',
  'Rebounding edge':
    'One team grabs significantly more offensive rebounds, giving them extra scoring chances each game.',
  'Turnover battle':
    'One team is much better at protecting the ball. Fewer turnovers mean more possessions and more chances to score.',
  '3PT volatility':
    'Teams that rely heavily on three-pointers are streaky \u2014 they can go cold at the worst time. This is a small penalty for that risk in a single-elimination tournament.',
  'Coaching Experience':
    'Tournament pedigree of each head coach \u2014 Final Four trips, championships, and total NCAA Tournament appearances. Experienced coaches consistently outperform their statistical profile in March.',
  'Location Advantage':
    'Distance each team must travel to the game venue (in miles). Teams playing closer to home benefit from crowd support and reduced travel fatigue.',
  'Player Availability':
    'Health score based on whether key players (season leaders in points, rebounds, assists) are still appearing in recent games. A lower score suggests a star may be injured or suspended.',
  'Market Signal':
    'Prediction market implied probability (Polymarket). Captures crowd wisdom about injuries, momentum, and intangibles our model can\'t see.',
};

interface FactorBarProps {
  factorName: string;
  team1Value: number | null;
  team2Value: number | null;
  /** Normalized edge: negative = team1 advantage, positive = team2 advantage */
  edge: number;
  weight: number;
  team1Color?: string;
  team2Color?: string;
}

export default function FactorBar({
  factorName,
  team1Value: rawTeam1Value,
  team2Value: rawTeam2Value,
  edge,
  weight,
  team1Color = '#2D6A3F',
  team2Color = '#8B6914',
}: FactorBarProps) {
  const team1Value = rawTeam1Value ?? 0;
  const team2Value = rawTeam2Value ?? 0;
  const total = team1Value + team2Value;
  const team1Pct = total > 0 ? (team1Value / total) * 100 : 50;
  const team2Pct = 100 - team1Pct;

  const clampedEdge = Math.max(-1, Math.min(1, edge));
  const isTeam1Advantage = clampedEdge < 0;
  const advantageLabel = isTeam1Advantage ? 'left' : 'right';

  const description = FACTOR_DESCRIPTIONS[factorName];

  return (
    <div className="py-3">
      {/* Factor label row */}
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-sm font-medium text-ink-muted truncate">{factorName}</span>
        <span className="font-mono text-[10px] sm:text-xs text-ink-faint flex-shrink-0">
          {(weight * 100).toFixed(0)}% weight
        </span>
      </div>

      {/* Description */}
      {description && (
        <p className="text-xs italic text-ink-faint leading-relaxed mb-2">{description}</p>
      )}

      {/* Tug-of-war bar */}
      <div className="flex h-8 overflow-hidden">
        <motion.div
          className="flex items-center justify-start pl-2 min-w-[12%]"
          style={{ backgroundColor: team1Color }}
          initial={{ width: '50%' }}
          animate={{ width: `${team1Pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <span className="font-mono text-xs font-medium text-white drop-shadow-sm whitespace-nowrap">
            {team1Value.toFixed(1)}
          </span>
        </motion.div>
        <motion.div
          className="flex items-center justify-end pr-2 min-w-[12%]"
          style={{ backgroundColor: team2Color }}
          initial={{ width: '50%' }}
          animate={{ width: `${team2Pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <span className="font-mono text-xs font-medium text-white drop-shadow-sm whitespace-nowrap">
            {team2Value.toFixed(1)}
          </span>
        </motion.div>
      </div>

      {/* Edge indicator */}
      <div className={`mt-1 font-mono text-xs text-ink-faint ${advantageLabel === 'right' ? 'text-right' : 'text-left'}`}>
        +{Math.abs(team1Value - team2Value).toFixed(1)} edge
      </div>
    </div>
  );
}
