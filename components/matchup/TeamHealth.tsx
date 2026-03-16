'use client';

import Image from 'next/image';
import type { HealthData } from '@/lib/types/prediction';
import { RECENCY_WINDOW } from '@/lib/algorithm/health';

type PlayerEntry = HealthData['team1Health']['players'][number];

interface PlayerGroup {
  name: string;
  entries: PlayerEntry[];
}

/** Group player entries by name so a player leading multiple categories appears once. */
function deduplicatePlayers(players: PlayerEntry[]): PlayerGroup[] {
  const map = new Map<string, PlayerEntry[]>();
  for (const p of players) {
    const existing = map.get(p.name);
    if (existing) {
      existing.push(p);
    } else {
      map.set(p.name, [p]);
    }
  }
  return Array.from(map.entries()).map(([name, entries]) => ({ name, entries }));
}

interface TeamHealthProps {
  healthData: HealthData;
  team1Name: string;
  team2Name: string;
  team1Color?: string;
  team2Color?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  points: 'Points',
  rebounds: 'Rebounds',
  assists: 'Assists',
};

const STATUS_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  available: { label: 'Available', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  questionable: { label: 'Questionable', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  likely_out: { label: 'Likely Out', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
};

function healthScoreColor(score: number): string {
  if (score >= 0.95) return 'text-emerald-600';
  if (score >= 0.80) return 'text-amber-600';
  return 'text-red-600';
}

function healthScoreBg(score: number): string {
  if (score >= 0.95) return 'bg-emerald-50';
  if (score >= 0.80) return 'bg-amber-50';
  return 'bg-red-50';
}

/** Deduplicate player names (same player may lead multiple categories). */
function uniqueNames(players: { name: string }[]): string[] {
  return [...new Set(players.map((p) => p.name))];
}

function getHealthNarrative(
  teamName: string,
  health: HealthData['team1Health'],
): string | null {
  const missing = health.players.filter((p) => p.status === 'likely_out');
  const questionable = health.players.filter((p) => p.status === 'questionable');

  if (missing.length === 0 && questionable.length === 0) return null;

  if (missing.length > 0) {
    const names = uniqueNames(missing);
    const cats = missing.map((p) => CATEGORY_LABELS[p.category]?.toLowerCase() ?? p.category).join(' and ');
    const nameStr = names.join(' and ');
    const plural = names.length > 1;
    return `${teamName}'s ${cats} ${plural ? 'leaders' : 'leader'} ${nameStr} ${plural ? 'have' : 'has'} not appeared in recent games — a potential injury or suspension concern.`;
  }

  if (questionable.length > 0) {
    const names = uniqueNames(questionable);
    const nameStr = names.join(' and ');
    const plural = names.length > 1;
    return `${teamName}'s ${nameStr} ${plural ? 'have' : 'has'} reduced recent appearances — worth monitoring.`;
  }

  return null;
}

function TeamColumn({
  teamName,
  health,
  teamColor,
}: {
  teamName: string;
  health: HealthData['team1Health'];
  teamColor?: string;
}) {
  const scoreNum = Math.round(health.score * 100);
  const narrative = getHealthNarrative(teamName, health);

  return (
    <div className="flex-1 min-w-0">
      <div
        className="px-3 py-2 border-b border-rule"
        style={{ borderLeftWidth: 2, borderLeftColor: teamColor ?? '#8B6914' }}
      >
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-xs font-medium uppercase tracking-widest text-ink-faint truncate">
            {teamName}
          </h4>
          <span
            className={`font-mono text-sm font-semibold ${healthScoreColor(health.score)} ${healthScoreBg(health.score)} px-1.5 py-0.5 rounded`}
          >
            {scoreNum}
          </span>
        </div>
      </div>

      <div className="divide-y divide-rule">
        {deduplicatePlayers(health.players).map((group) => {
          // Use the worst status across the player's categories
          const worstStatus = group.entries.some((e) => e.status === 'likely_out')
            ? 'likely_out'
            : group.entries.some((e) => e.status === 'questionable')
              ? 'questionable'
              : 'available';
          const badge = STATUS_BADGE[worstStatus] ?? STATUS_BADGE.available;
          const first = group.entries[0];
          const catLabels = group.entries
            .map((e) => CATEGORY_LABELS[e.category] ?? e.category)
            .join(', ');
          const totalLed = group.entries.reduce((s, e) => s + e.gamesLed, 0);
          // Use the min recentAppearances across categories (worst signal)
          const minRecent = Math.min(...group.entries.map((e) => e.recentAppearances));

          return (
            <div key={group.name} className="flex items-center gap-2 px-3 py-2">
              {/* Headshot */}
              <div className="relative h-8 w-8 flex-shrink-0 rounded-full bg-ink/[0.06] overflow-hidden">
                {first.headshot ? (
                  <Image
                    src={first.headshot}
                    alt={first.name}
                    fill
                    className="object-cover"
                    sizes="32px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] text-ink-faint">
                    ?
                  </div>
                )}
              </div>

              {/* Player info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-ink truncate">{group.name}</p>
                <p className="text-[10px] text-ink-faint">
                  {catLabels} &middot; Led {totalLed} cat-games of {first.totalGamesWithData} &middot; Recent: {minRecent}/{first.totalGamesWithData >= 8 ? RECENCY_WINDOW : '?'}
                </p>
              </div>

              {/* Status badge */}
              <span
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${badge.bg} ${badge.color} flex-shrink-0`}
              >
                {badge.label}
              </span>
            </div>
          );
        })}
      </div>

      {narrative && (
        <p className="px-3 py-2 text-xs italic text-ink-muted border-t border-rule">
          {narrative}
        </p>
      )}
    </div>
  );
}

export default function TeamHealth({
  healthData,
  team1Name,
  team2Name,
  team1Color,
  team2Color,
}: TeamHealthProps) {
  // Don't render if both teams are healthy with no concerns
  const hasConcerns =
    healthData.team1Health.players.some((p) => p.status !== 'available') ||
    healthData.team2Health.players.some((p) => p.status !== 'available');

  const bothHealthy = !hasConcerns;

  return (
    <div className="w-full border border-rule bg-surface overflow-hidden">
      <div className="px-4 py-3 border-b border-rule">
        <h3 className="text-xs font-medium uppercase tracking-widest text-ink-faint">
          Player Availability
        </h3>
      </div>

      {bothHealthy ? (
        <div className="px-4 py-4 text-center">
          <p className="text-sm text-ink-muted">
            Both teams appear healthy — all key players present in recent games.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-rule">
          <TeamColumn
            teamName={team1Name}
            health={healthData.team1Health}
            teamColor={team1Color}
          />
          <TeamColumn
            teamName={team2Name}
            health={healthData.team2Health}
            teamColor={team2Color}
          />
        </div>
      )}

      <div className="px-4 py-2 border-t border-rule bg-ink/[0.02]">
        <p className="text-[10px] text-ink-faint text-center">
          Based on game leader data only — not a confirmed injury report
        </p>
      </div>
    </div>
  );
}
