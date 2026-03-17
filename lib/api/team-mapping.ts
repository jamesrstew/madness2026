interface TeamMapping {
  espnId: number;
  cbbdName: string;
  ncaaName: string;
}

export const TEAM_MAPPING: Record<number, TeamMapping> = {
  // ── East Region ──
  150: { espnId: 150, cbbdName: 'Duke', ncaaName: 'Duke' },
  41: { espnId: 41, cbbdName: 'UConn', ncaaName: 'Connecticut' },
  127: { espnId: 127, cbbdName: 'Michigan State', ncaaName: 'Michigan State' },
  2305: { espnId: 2305, cbbdName: 'Kansas', ncaaName: 'Kansas' },
  2599: { espnId: 2599, cbbdName: "St. John's", ncaaName: "St. John's (NY)" },
  97: { espnId: 97, cbbdName: 'Louisville', ncaaName: 'Louisville' },
  26: { espnId: 26, cbbdName: 'UCLA', ncaaName: 'UCLA' },
  194: { espnId: 194, cbbdName: 'Ohio State', ncaaName: 'Ohio State' },
  2628: { espnId: 2628, cbbdName: 'TCU', ncaaName: 'TCU' },
  2116: { espnId: 2116, cbbdName: 'UCF', ncaaName: 'UCF' },
  58: { espnId: 58, cbbdName: 'South Florida', ncaaName: 'South Florida' },
  2460: { espnId: 2460, cbbdName: 'Northern Iowa', ncaaName: 'Northern Iowa' },
  2856: { espnId: 2856, cbbdName: 'California Baptist', ncaaName: 'California Baptist' },
  2449: { espnId: 2449, cbbdName: 'North Dakota State', ncaaName: 'North Dakota St.' },
  231: { espnId: 231, cbbdName: 'Furman', ncaaName: 'Furman' },
  2561: { espnId: 2561, cbbdName: 'Siena', ncaaName: 'Siena' },

  // ── West Region ──
  12: { espnId: 12, cbbdName: 'Arizona', ncaaName: 'Arizona' },
  2509: { espnId: 2509, cbbdName: 'Purdue', ncaaName: 'Purdue' },
  2250: { espnId: 2250, cbbdName: 'Gonzaga', ncaaName: 'Gonzaga' },
  8: { espnId: 8, cbbdName: 'Arkansas', ncaaName: 'Arkansas' },
  275: { espnId: 275, cbbdName: 'Wisconsin', ncaaName: 'Wisconsin' },
  252: { espnId: 252, cbbdName: 'BYU', ncaaName: 'BYU' },
  2390: { espnId: 2390, cbbdName: 'Miami', ncaaName: 'Miami (FL)' },
  222: { espnId: 222, cbbdName: 'Villanova', ncaaName: 'Villanova' },
  328: { espnId: 328, cbbdName: 'Utah State', ncaaName: 'Utah State' },
  142: { espnId: 142, cbbdName: 'Missouri', ncaaName: 'Missouri' },
  2272: { espnId: 2272, cbbdName: 'High Point', ncaaName: 'High Point' },
  62: { espnId: 62, cbbdName: "Hawai'i", ncaaName: "Hawai'i" },
  338: { espnId: 338, cbbdName: 'Kennesaw State', ncaaName: 'Kennesaw State' },
  2511: { espnId: 2511, cbbdName: 'Queens University', ncaaName: 'Queens (NC)' },
  112358: { espnId: 112358, cbbdName: 'Long Island University', ncaaName: 'Long Island' },

  // ── South Region ──
  57: { espnId: 57, cbbdName: 'Florida', ncaaName: 'Florida' },
  248: { espnId: 248, cbbdName: 'Houston', ncaaName: 'Houston' },
  356: { espnId: 356, cbbdName: 'Illinois', ncaaName: 'Illinois' },
  158: { espnId: 158, cbbdName: 'Nebraska', ncaaName: 'Nebraska' },
  238: { espnId: 238, cbbdName: 'Vanderbilt', ncaaName: 'Vanderbilt' },
  153: { espnId: 153, cbbdName: 'North Carolina', ncaaName: 'North Carolina' },
  2608: { espnId: 2608, cbbdName: "Saint Mary's", ncaaName: "Saint Mary's (CA)" },
  228: { espnId: 228, cbbdName: 'Clemson', ncaaName: 'Clemson' },
  2294: { espnId: 2294, cbbdName: 'Iowa', ncaaName: 'Iowa' },
  245: { espnId: 245, cbbdName: 'Texas A&M', ncaaName: 'Texas A&M' },
  2670: { espnId: 2670, cbbdName: 'VCU', ncaaName: 'VCU' },
  2377: { espnId: 2377, cbbdName: 'McNeese', ncaaName: 'McNeese' },
  2653: { espnId: 2653, cbbdName: 'Troy', ncaaName: 'Troy' },
  219: { espnId: 219, cbbdName: 'Pennsylvania', ncaaName: 'Pennsylvania' },
  70: { espnId: 70, cbbdName: 'Idaho', ncaaName: 'Idaho' },

  // ── Midwest Region ──
  130: { espnId: 130, cbbdName: 'Michigan', ncaaName: 'Michigan' },
  66: { espnId: 66, cbbdName: 'Iowa State', ncaaName: 'Iowa State' },
  258: { espnId: 258, cbbdName: 'Virginia', ncaaName: 'Virginia' },
  333: { espnId: 333, cbbdName: 'Alabama', ncaaName: 'Alabama' },
  2641: { espnId: 2641, cbbdName: 'Texas Tech', ncaaName: 'Texas Tech' },
  2633: { espnId: 2633, cbbdName: 'Tennessee', ncaaName: 'Tennessee' },
  96: { espnId: 96, cbbdName: 'Kentucky', ncaaName: 'Kentucky' },
  61: { espnId: 61, cbbdName: 'Georgia', ncaaName: 'Georgia' },
  139: { espnId: 139, cbbdName: 'Saint Louis', ncaaName: 'Saint Louis' },
  2541: { espnId: 2541, cbbdName: 'Santa Clara', ncaaName: 'Santa Clara' },
  2006: { espnId: 2006, cbbdName: 'Akron', ncaaName: 'Akron' },
  2275: { espnId: 2275, cbbdName: 'Hofstra', ncaaName: 'Hofstra' },
  2750: { espnId: 2750, cbbdName: 'Wright State', ncaaName: 'Wright State' },
  2634: { espnId: 2634, cbbdName: 'Tennessee State', ncaaName: 'Tennessee State' },

  // ── First Four Teams ──
  152: { espnId: 152, cbbdName: 'NC State', ncaaName: 'North Carolina St.' },
  251: { espnId: 251, cbbdName: 'Texas', ncaaName: 'Texas' },
  2567: { espnId: 2567, cbbdName: 'SMU', ncaaName: 'SMU' },
  193: { espnId: 193, cbbdName: 'Miami (OH)', ncaaName: 'Miami (OH)' },
  2329: { espnId: 2329, cbbdName: 'Lehigh', ncaaName: 'Lehigh' },
  2504: { espnId: 2504, cbbdName: 'Prairie View A&M', ncaaName: 'Prairie View A&M' },
  2378: { espnId: 2378, cbbdName: 'UMBC', ncaaName: 'UMBC' },
  47: { espnId: 47, cbbdName: 'Howard', ncaaName: 'Howard' },
};

const espnToCbbd = new Map<number, string>();
const cbbdToEspn = new Map<string, number>();

for (const [id, mapping] of Object.entries(TEAM_MAPPING)) {
  espnToCbbd.set(Number(id), mapping.cbbdName);
  cbbdToEspn.set(mapping.cbbdName, Number(id));
}

export function getCbbdName(espnId: number): string | undefined {
  return espnToCbbd.get(espnId);
}

export function getEspnId(cbbdName: string): number | undefined {
  return cbbdToEspn.get(cbbdName);
}
