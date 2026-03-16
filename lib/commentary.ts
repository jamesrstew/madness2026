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

// Upset facts keyed by the higher seed (underdog) range so they're contextually relevant
function getUpsetFact(higherSeed: number, lowerSeed: number, hash: number): string {
  if (higherSeed === 16 && lowerSeed === 1) {
    return 'Only one 16-seed has ever beaten a 1-seed — UMBC over Virginia in 2018.';
  }
  if (higherSeed === 15) {
    return '15-seeds have won 10 first-round games since 1985. It happens more than you think.';
  }
  if (higherSeed === 14) {
    return '14-seeds upset 3-seeds about 15% of the time. Not impossible.';
  }
  if (higherSeed === 13) {
    return '13-over-4 upsets happen roughly once a year in the tournament.';
  }
  if (higherSeed === 12) {
    const facts = [
      'A 12-seed beats a 5-seed about 35% of the time — the most common upset in March.',
      '12-vs-5 is the classic upset pick. Multiple 12-seeds make the Sweet 16 every few years.',
    ];
    return pick(facts, hash);
  }
  if (higherSeed === 11) {
    return '11-seeds have reached the Final Four — Loyola Chicago did it in 2018 with Sister Jean.';
  }
  if (higherSeed === 10) {
    return '10-seeds knock off 7-seeds about 40% of the time. This is nearly a coin flip.';
  }

  // Generic for large seed gaps
  const generic = [
    'Since 1985, at least one double-digit seed has made the Sweet 16 every year.',
    'The tournament loves an underdog story. Upsets are what makes March, March.',
    'Higher seeds have the edge on paper, but single-elimination is a different beast.',
  ];
  return pick(generic, hash);
}

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
  seed2?: number,
  options?: {
    team1Distance?: number;
    team2Distance?: number;
    coachingDiff?: number;
    coach1Name?: string;
    coach2Name?: string;
    team1HealthStatus?: string;
    team2HealthStatus?: string;
    team1MissingPlayers?: string[];
    team2MissingPlayers?: string[];
  },
): string[] {
  const lines: string[] = [];
  const hash = hashStr(team1 + team2);

  // Rivalry detection
  const rivals1 = RIVALRIES[team1] ?? [];
  const rivals2 = RIVALRIES[team2] ?? [];
  if (rivals1.includes(team2) || rivals2.includes(team1)) {
    lines.push(pick(RIVALRY_LINES, hash));
  }

  // Health/injury commentary — placed early so it survives the 3-line cap
  if (options?.team1MissingPlayers && options.team1MissingPlayers.length > 0) {
    const names = options.team1MissingPlayers.join(' and ');
    lines.push(
      `${team1} may be without ${names} — that's a significant blow to their chances.`,
    );
  }
  if (options?.team2MissingPlayers && options.team2MissingPlayers.length > 0) {
    const names = options.team2MissingPlayers.join(' and ');
    lines.push(
      `${team2} may be without ${names} — that's a significant blow to their chances.`,
    );
  }

  // Seed-based upset commentary
  if (seed1 !== undefined && seed2 !== undefined) {
    const diff = Math.abs(seed1 - seed2);
    const higherSeed = seed1 > seed2 ? seed1 : seed2;
    const lowerSeed = seed1 < seed2 ? seed1 : seed2;
    const underdog = seed1 > seed2 ? team1 : team2;
    const favorite = seed1 > seed2 ? team2 : team1;

    if (diff >= 5) {
      lines.push(
        `${higherSeed}-seed ${underdog} vs ${lowerSeed}-seed ${favorite}? ` +
          getUpsetFact(higherSeed, lowerSeed, hash + 1)
      );
    } else if (diff >= 3) {
      lines.push(
        `${underdog} is the underdog, but ${higherSeed}-seeds pull upsets more often than you'd think.`
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

  // Location/travel commentary
  if (options?.team1Distance != null && options?.team2Distance != null) {
    const distDiff = Math.abs(options.team1Distance - options.team2Distance);
    if (distDiff > 500) {
      const closer = options.team1Distance < options.team2Distance ? team1 : team2;
      const farther = options.team1Distance < options.team2Distance ? team2 : team1;
      lines.push(
        `${closer} is playing much closer to home — ${farther} has a long trip to the venue.`
      );
    }
  }

  // Coaching pedigree commentary
  if (options?.coachingDiff != null && Math.abs(options.coachingDiff) >= 3) {
    const betterCoach = options.coachingDiff > 0 ? options.coach1Name : options.coach2Name;
    if (betterCoach) {
      lines.push(
        `Coach ${betterCoach} has deep tournament experience — that pedigree matters in March.`
      );
    }
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

/**
 * Returns a one-sentence verdict explaining the pick. Used for the Verdict
 * card on the matchup page and the inline pick assistant on the bracket.
 */
export function getQuickVerdict(
  favoredTeam: string,
  otherTeam: string,
  winPct: number,
  seed1?: number,
  seed2?: number,
): string {
  const pct = Math.round(winPct * 100);
  const hash = hashStr(favoredTeam + otherTeam);

  // Dominant favorite
  if (winPct >= 0.75) {
    const lines = [
      `${favoredTeam} is simply the better team — elite on both ends of the floor.`,
      `${favoredTeam} should cruise here. Their efficiency numbers are dominant.`,
      `This is ${favoredTeam}'s game to lose. Massive edges across the board.`,
    ];
    return pick(lines, hash);
  }

  // Clear favorite
  if (winPct >= 0.62) {
    const lines = [
      `${favoredTeam} has the edge with superior defense and tougher schedule.`,
      `${favoredTeam}'s efficiency margin is clearly better — they control the tempo.`,
      `${favoredTeam} wins the numbers game with better shooting and rebounding.`,
    ];
    return pick(lines, hash);
  }

  // Slight favorite
  if (winPct >= 0.55) {
    const lines = [
      `${favoredTeam} has a thin edge — ${otherTeam} can steal this with a hot shooting night.`,
      `Slight advantage ${favoredTeam}, but this is anyone's game.`,
      `${favoredTeam} is narrowly favored, but don't sleep on ${otherTeam}.`,
    ];
    return pick(lines, hash);
  }

  // Upset pick scenario (favorite is a higher seed)
  if (seed1 !== undefined && seed2 !== undefined && Math.abs(seed1 - seed2) >= 4) {
    return `This is a pure coin flip. Go with your gut — upsets at this seed line happen all the time.`;
  }

  // True toss-up
  const lines = [
    `This is a coin flip. Trust your instincts on this one.`,
    `Dead even. Pick the team you believe in — the numbers won't help you here.`,
    `The algorithm says toss-up. Go with your gut.`,
  ];
  return pick(lines, hash);
}
