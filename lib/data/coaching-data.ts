/**
 * Head coach tournament pedigree for all 68 tournament teams (2026 bracket).
 * Keyed by ESPN team ID.
 *
 * Data sourced from sports-reference.com and NCAA records.
 * Reflects career head-coaching records through the 2024-25 season
 * (prior to the 2026 tournament).
 */

export interface CoachProfile {
  name: string;
  tournamentAppearances: number;
  sweetSixteens: number;
  finalFours: number;
  championships: number;
  yearsAsHeadCoach: number;
}

export const COACH_DATA: Record<number, CoachProfile> = {
  // ── East Region ──
  150:  { name: 'Jon Scheyer',         tournamentAppearances: 3,  sweetSixteens: 2,  finalFours: 1,  championships: 0, yearsAsHeadCoach: 4  },  // Duke
  41:   { name: 'Dan Hurley',          tournamentAppearances: 5,  sweetSixteens: 3,  finalFours: 2,  championships: 2, yearsAsHeadCoach: 14 },  // UConn
  127:  { name: 'Tom Izzo',            tournamentAppearances: 26, sweetSixteens: 16, finalFours: 8,  championships: 1, yearsAsHeadCoach: 31 },  // Michigan State
  2305: { name: 'Bill Self',           tournamentAppearances: 22, sweetSixteens: 11, finalFours: 4,  championships: 2, yearsAsHeadCoach: 31 },  // Kansas
  2599: { name: 'Rick Pitino',         tournamentAppearances: 18, sweetSixteens: 10, finalFours: 7,  championships: 2, yearsAsHeadCoach: 38 },  // St. John's
  97:   { name: 'Pat Kelsey',          tournamentAppearances: 1,  sweetSixteens: 0,  finalFours: 0,  championships: 0, yearsAsHeadCoach: 5  },  // Louisville
  26:   { name: 'Mick Cronin',         tournamentAppearances: 11, sweetSixteens: 2,  finalFours: 1,  championships: 0, yearsAsHeadCoach: 21 },  // UCLA
  194:  { name: 'Jake Diebler',        tournamentAppearances: 1,  sweetSixteens: 0,  finalFours: 0,  championships: 0, yearsAsHeadCoach: 2  },  // Ohio State
  2628: { name: 'Jamie Dixon',         tournamentAppearances: 10, sweetSixteens: 2,  finalFours: 0,  championships: 0, yearsAsHeadCoach: 23 },  // TCU
  2116: { name: 'Johnny Dawkins',      tournamentAppearances: 4,  sweetSixteens: 1,  finalFours: 0,  championships: 0, yearsAsHeadCoach: 17 },  // UCF
  58:   { name: 'Amir Abdur-Rahim',    tournamentAppearances: 1,  sweetSixteens: 0,  finalFours: 0,  championships: 0, yearsAsHeadCoach: 3  },  // South Florida
  2460: { name: 'Ben Jacobson',        tournamentAppearances: 6,  sweetSixteens: 1,  finalFours: 0,  championships: 0, yearsAsHeadCoach: 20 },  // Northern Iowa
  2856: { name: 'Rick Croy',           tournamentAppearances: 1,  sweetSixteens: 0,  finalFours: 0,  championships: 0, yearsAsHeadCoach: 6  },  // California Baptist
  2449: { name: 'David Richman',       tournamentAppearances: 2,  sweetSixteens: 0,  finalFours: 0,  championships: 0, yearsAsHeadCoach: 7  },  // North Dakota State
  231:  { name: 'Bob Richey',          tournamentAppearances: 2,  sweetSixteens: 0,  finalFours: 0,  championships: 0, yearsAsHeadCoach: 8  },  // Furman
  2561: { name: 'Carmen Maciariello',  tournamentAppearances: 1,  sweetSixteens: 0,  finalFours: 0,  championships: 0, yearsAsHeadCoach: 5  },  // Siena

  // ── West Region ──
  12:   { name: 'Tommy Lloyd',         tournamentAppearances: 4,  sweetSixteens: 2,  finalFours: 1,  championships: 0, yearsAsHeadCoach: 5  },  // Arizona
  2509: { name: 'Matt Painter',        tournamentAppearances: 14, sweetSixteens: 5,  finalFours: 2,  championships: 1, yearsAsHeadCoach: 21 },  // Purdue
  2250: { name: 'Mark Few',            tournamentAppearances: 25, sweetSixteens: 8,  finalFours: 2,  championships: 0, yearsAsHeadCoach: 27 },  // Gonzaga
  8:    { name: 'John Calipari',       tournamentAppearances: 20, sweetSixteens: 10, finalFours: 6,  championships: 1, yearsAsHeadCoach: 33 },  // Arkansas
  275:  { name: 'Greg Gard',           tournamentAppearances: 7,  sweetSixteens: 2,  finalFours: 0,  championships: 0, yearsAsHeadCoach: 10 },  // Wisconsin
  252:  { name: 'Kevin Young',         tournamentAppearances: 1,  sweetSixteens: 0,  finalFours: 0,  championships: 0, yearsAsHeadCoach: 2  },  // BYU
  2390: { name: 'Jim Larrañaga',       tournamentAppearances: 11, sweetSixteens: 4,  finalFours: 2,  championships: 0, yearsAsHeadCoach: 40 },  // Miami (FL)
  222:  { name: 'Kyle Neptune',        tournamentAppearances: 1,  sweetSixteens: 0,  finalFours: 0,  championships: 0, yearsAsHeadCoach: 4  },  // Villanova
  328:  { name: 'Jerrod Calhoun',      tournamentAppearances: 2,  sweetSixteens: 0,  finalFours: 0,  championships: 0, yearsAsHeadCoach: 9  },  // Utah State
  142:  { name: 'Dennis Gates',        tournamentAppearances: 2,  sweetSixteens: 0,  finalFours: 0,  championships: 0, yearsAsHeadCoach: 6  },  // Missouri
  152:  { name: 'Kevin Keatts',        tournamentAppearances: 4,  sweetSixteens: 1,  finalFours: 1,  championships: 0, yearsAsHeadCoach: 10 },  // NC State
  251:  { name: 'Rodney Terry',        tournamentAppearances: 2,  sweetSixteens: 0,  finalFours: 0,  championships: 0, yearsAsHeadCoach: 5  },  // Texas
  2272: { name: 'Tubby Smith',         tournamentAppearances: 16, sweetSixteens: 5,  finalFours: 2,  championships: 1, yearsAsHeadCoach: 30 },  // High Point
  62:   { name: 'Eran Ganot',          tournamentAppearances: 2,  sweetSixteens: 0,  finalFours: 0,  championships: 0, yearsAsHeadCoach: 11 },  // Hawaii
  338:  { name: 'Antoine Pettway',      tournamentAppearances: 1,  sweetSixteens: 0,  finalFours: 0,  championships: 0, yearsAsHeadCoach: 2  },  // Kennesaw State
  2511: { name: 'Bart Lundy',          tournamentAppearances: 1,  sweetSixteens: 0,  finalFours: 0,  championships: 0, yearsAsHeadCoach: 12 },  // Queens
  112358: { name: 'Rod Strickland',    tournamentAppearances: 1,  sweetSixteens: 0,  finalFours: 0,  championships: 0, yearsAsHeadCoach: 4  },  // Long Island

  // ── South Region ──
  57:   { name: 'Todd Golden',         tournamentAppearances: 2,  sweetSixteens: 1,  finalFours: 0,  championships: 0, yearsAsHeadCoach: 5  },  // Florida
  248:  { name: 'Kelvin Sampson',      tournamentAppearances: 12, sweetSixteens: 5,  finalFours: 2,  championships: 0, yearsAsHeadCoach: 30 },  // Houston
  356:  { name: 'Brad Underwood',      tournamentAppearances: 5,  sweetSixteens: 2,  finalFours: 0,  championships: 0, yearsAsHeadCoach: 11 },  // Illinois
  158:  { name: 'Fred Hoiberg',        tournamentAppearances: 2,  sweetSixteens: 0,  finalFours: 0,  championships: 0, yearsAsHeadCoach: 10 },  // Nebraska
  238:  { name: 'Mark Byington',       tournamentAppearances: 1,  sweetSixteens: 0,  finalFours: 0,  championships: 0, yearsAsHeadCoach: 12 },  // Vanderbilt
  153:  { name: 'Hubert Davis',        tournamentAppearances: 4,  sweetSixteens: 2,  finalFours: 1,  championships: 0, yearsAsHeadCoach: 5  },  // North Carolina
  2608: { name: 'Randy Bennett',       tournamentAppearances: 7,  sweetSixteens: 1,  finalFours: 0,  championships: 0, yearsAsHeadCoach: 25 },  // Saint Mary's
  228:  { name: 'Brad Brownell',       tournamentAppearances: 5,  sweetSixteens: 2,  finalFours: 1,  championships: 0, yearsAsHeadCoach: 22 },  // Clemson
  2294: { name: 'Fran McCaffery',      tournamentAppearances: 7,  sweetSixteens: 1,  finalFours: 0,  championships: 0, yearsAsHeadCoach: 29 },  // Iowa
  245:  { name: 'Buzz Williams',       tournamentAppearances: 7,  sweetSixteens: 2,  finalFours: 0,  championships: 0, yearsAsHeadCoach: 18 },  // Texas A&M
  2670: { name: 'Ryan Odom',           tournamentAppearances: 2,  sweetSixteens: 0,  finalFours: 0,  championships: 0, yearsAsHeadCoach: 9  },  // VCU
  2377: { name: 'Will Wade',           tournamentAppearances: 4,  sweetSixteens: 1,  finalFours: 0,  championships: 0, yearsAsHeadCoach: 11 },  // McNeese
  2653: { name: 'Scott Cross',         tournamentAppearances: 1,  sweetSixteens: 0,  finalFours: 0,  championships: 0, yearsAsHeadCoach: 8  },  // Troy
  219:  { name: 'Steve Donahue',       tournamentAppearances: 2,  sweetSixteens: 1,  finalFours: 0,  championships: 0, yearsAsHeadCoach: 18 },  // Penn
  70:   { name: 'Alex Pribble',        tournamentAppearances: 1,  sweetSixteens: 0,  finalFours: 0,  championships: 0, yearsAsHeadCoach: 2  },  // Idaho
  2329: { name: 'Brett Reed',          tournamentAppearances: 3,  sweetSixteens: 0,  finalFours: 0,  championships: 0, yearsAsHeadCoach: 18 },  // Lehigh
  2504: { name: 'Byron Smith',         tournamentAppearances: 1,  sweetSixteens: 0,  finalFours: 0,  championships: 0, yearsAsHeadCoach: 5  },  // Prairie View A&M

  // ── Midwest Region ──
  130:  { name: 'Dusty May',           tournamentAppearances: 3,  sweetSixteens: 1,  finalFours: 0,  championships: 0, yearsAsHeadCoach: 7  },  // Michigan
  66:   { name: 'T.J. Otzelberger',    tournamentAppearances: 4,  sweetSixteens: 2,  finalFours: 0,  championships: 0, yearsAsHeadCoach: 9  },  // Iowa State
  258:  { name: 'Tony Bennett',        tournamentAppearances: 12, sweetSixteens: 4,  finalFours: 2,  championships: 1, yearsAsHeadCoach: 18 },  // Virginia
  333:  { name: 'Nate Oats',           tournamentAppearances: 5,  sweetSixteens: 2,  finalFours: 1,  championships: 0, yearsAsHeadCoach: 10 },  // Alabama
  2641: { name: 'Grant McCasland',     tournamentAppearances: 3,  sweetSixteens: 0,  finalFours: 0,  championships: 0, yearsAsHeadCoach: 9  },  // Texas Tech
  2633: { name: 'Rick Barnes',         tournamentAppearances: 18, sweetSixteens: 7,  finalFours: 1,  championships: 0, yearsAsHeadCoach: 37 },  // Tennessee
  96:   { name: 'Mark Pope',           tournamentAppearances: 2,  sweetSixteens: 0,  finalFours: 0,  championships: 0, yearsAsHeadCoach: 6  },  // Kentucky
  61:   { name: 'Mike White',          tournamentAppearances: 7,  sweetSixteens: 2,  finalFours: 0,  championships: 0, yearsAsHeadCoach: 13 },  // Georgia
  139:  { name: 'Josh Schertz',        tournamentAppearances: 1,  sweetSixteens: 0,  finalFours: 0,  championships: 0, yearsAsHeadCoach: 7  },  // Saint Louis
  2541: { name: 'Herb Sendek',         tournamentAppearances: 8,  sweetSixteens: 1,  finalFours: 0,  championships: 0, yearsAsHeadCoach: 30 },  // Santa Clara
  2567: { name: 'Andy Enfield',        tournamentAppearances: 6,  sweetSixteens: 2,  finalFours: 0,  championships: 0, yearsAsHeadCoach: 13 },  // SMU
  193:  { name: 'Travis Steele',       tournamentAppearances: 2,  sweetSixteens: 0,  finalFours: 0,  championships: 0, yearsAsHeadCoach: 8  },  // Miami (OH)
  2006: { name: 'John Groce',          tournamentAppearances: 4,  sweetSixteens: 0,  finalFours: 0,  championships: 0, yearsAsHeadCoach: 14 },  // Akron
  2275: { name: 'Speedy Claxton',      tournamentAppearances: 1,  sweetSixteens: 0,  finalFours: 0,  championships: 0, yearsAsHeadCoach: 4  },  // Hofstra
  2750: { name: 'Clint Sargent',       tournamentAppearances: 1,  sweetSixteens: 0,  finalFours: 0,  championships: 0, yearsAsHeadCoach: 6  },  // Wright State
  2634: { name: 'Brian Collins',       tournamentAppearances: 1,  sweetSixteens: 0,  finalFours: 0,  championships: 0, yearsAsHeadCoach: 4  },  // Tennessee State
  2378: { name: 'Jim Ferry',           tournamentAppearances: 2,  sweetSixteens: 0,  finalFours: 0,  championships: 0, yearsAsHeadCoach: 12 },  // UMBC
  47:   { name: 'Kenny Blakeney',      tournamentAppearances: 1,  sweetSixteens: 0,  finalFours: 0,  championships: 0, yearsAsHeadCoach: 7  },  // Howard
};
