const RIVALRIES: Record<string, string[]> = {
  'Duke': ['North Carolina', 'UNC'],
  'North Carolina': ['Duke'],
  'UNC': ['Duke'],
  'Kansas': ['Kentucky', 'Missouri'],
  'Kentucky': ['Kansas', 'Louisville'],
  'Louisville': ['Kentucky'],
  'Missouri': ['Kansas'],
  'Michigan': ['Michigan State', 'Michigan St.', 'Ohio State', 'Ohio St.'],
  'Michigan State': ['Michigan'],
  'Michigan St.': ['Michigan'],
  'Ohio State': ['Michigan'],
  'Ohio St.': ['Michigan'],
  'UCLA': ['USC'],
  'USC': ['UCLA'],
  'Indiana': ['Purdue'],
  'Purdue': ['Indiana'],
  'Gonzaga': ['Saint Mary\'s', "St. Mary's"],
  'Arizona': ['Arizona State', 'Arizona St.'],
  'Arizona State': ['Arizona'],
  'Arizona St.': ['Arizona'],
};

const UPSET_FACTS = [
  'A 12-seed beats a 5-seed about 35% of the time historically!',
  'Since 1985, at least one double-digit seed has made the Sweet 16 every year.',
  'The first 16-over-1 upset happened in 2018 when UMBC beat Virginia.',
  '15-seeds have won 10 first-round games since 1985.',
  '11-seeds have reached the Final Four — it happened with Loyola Chicago in 2018.',
];

const DOMINANCE_LINES = [
  `{team}'s offense is scary efficient — hard to beat when they get rolling.`,
  `{team} has been on a tear. Good luck slowing them down.`,
  `When {team} is clicking, they look unbeatable.`,
  `{team} is the kind of team that makes the tournament look easy.`,
];

const CLOSE_MATCHUP_LINES = [
  'This is a coin flip. Buckle up.',
  'Razor-thin margins here — this one could go either way.',
  'No clear favorite. Expect a nail-biter.',
  "This matchup screams overtime. Don't blink.",
];

const RIVALRY_LINES = [
  'This is one of the greatest rivalries in college basketball. Throw the stats out.',
  'Rivalry game alert! Anything can happen when these two meet.',
  'The history between these programs is legendary. Expect intensity.',
];

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return h;
}

export function getMatchupCommentary(
  team1: string,
  team2: string,
  team1WinPct: number,
  seed1?: number,
  seed2?: number
): string[] {
  const lines: string[] = [];
  const hash = hashStr(team1 + team2);

  // Rivalry detection
  const rivals1 = RIVALRIES[team1] ?? [];
  const rivals2 = RIVALRIES[team2] ?? [];
  if (rivals1.includes(team2) || rivals2.includes(team1)) {
    lines.push(pick(RIVALRY_LINES, hash));
  }

  // Seed-based upset commentary
  if (seed1 !== undefined && seed2 !== undefined) {
    const diff = Math.abs(seed1 - seed2);
    const higherSeed = seed1 > seed2 ? seed1 : seed2;
    const lowerSeed = seed1 < seed2 ? seed1 : seed2;
    const underdog = seed1 > seed2 ? team1 : team2;
    const favorite = seed1 > seed2 ? team2 : team1;

    if (diff >= 7) {
      lines.push(
        `${higherSeed}-seed ${underdog} vs ${lowerSeed}-seed ${favorite}? ` +
          pick(UPSET_FACTS, hash + 1)
      );
    } else if (diff >= 4) {
      lines.push(
        `${underdog} is the underdog, but seeds ${higherSeed} and above pull upsets more often than you'd think.`
      );
    }

    if (lowerSeed === 1 && higherSeed === 16) {
      lines.push(
        'No 1-seed has ever lost to a 16-seed in the first round... until UMBC shocked Virginia in 2018.'
      );
    }
  }

  // Win probability commentary
  const dominant = team1WinPct >= 0.7 ? team1 : team1WinPct <= 0.3 ? team2 : null;
  if (dominant) {
    lines.push(pick(DOMINANCE_LINES, hash + 2).replace('{team}', dominant));
  } else if (team1WinPct >= 0.4 && team1WinPct <= 0.6) {
    lines.push(pick(CLOSE_MATCHUP_LINES, hash + 3));
  }

  // If we have no lines yet, add a generic one
  if (lines.length === 0) {
    lines.push(
      team1WinPct > 0.5
        ? `${team1} has the edge, but ${team2} can't be counted out.`
        : `${team2} has the edge, but ${team1} can't be counted out.`
    );
  }

  return lines.slice(0, 3);
}
