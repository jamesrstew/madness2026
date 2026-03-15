interface TeamMapping {
  espnId: number;
  cbbdName: string;
  ncaaName: string;
}

export const TEAM_MAPPING: Record<number, TeamMapping> = {
  // ACC
  150: { espnId: 150, cbbdName: 'Duke', ncaaName: 'Duke' },
  153: { espnId: 153, cbbdName: 'North Carolina', ncaaName: 'North Carolina' },
  228: { espnId: 228, cbbdName: 'Clemson', ncaaName: 'Clemson' },
  259: { espnId: 259, cbbdName: 'Virginia Tech', ncaaName: 'Virginia Tech' },
  2545: { espnId: 2545, cbbdName: 'SMU', ncaaName: 'SMU' },
  52: { espnId: 52, cbbdName: 'Florida State', ncaaName: 'Florida State' },
  97: { espnId: 97, cbbdName: 'Louisville', ncaaName: 'Louisville' },

  // Big 12
  2305: { espnId: 2305, cbbdName: 'Kansas', ncaaName: 'Kansas' },
  66: { espnId: 66, cbbdName: 'Baylor', ncaaName: 'Baylor' },
  277: { espnId: 277, cbbdName: 'West Virginia', ncaaName: 'West Virginia' },
  2641: { espnId: 2641, cbbdName: 'Texas Tech', ncaaName: 'Texas Tech' },
  12: { espnId: 12, cbbdName: 'Arizona', ncaaName: 'Arizona' },
  9: { espnId: 9, cbbdName: 'Arizona State', ncaaName: 'Arizona State' },
  252: { espnId: 252, cbbdName: 'BYU', ncaaName: 'BYU' },
  2132: { espnId: 2132, cbbdName: 'Cincinnati', ncaaName: 'Cincinnati' },
  38: { espnId: 38, cbbdName: 'Colorado', ncaaName: 'Colorado' },
  2116: { espnId: 2116, cbbdName: 'UCF', ncaaName: 'UCF' },
  254: { espnId: 254, cbbdName: 'Utah', ncaaName: 'Utah' },
  2306: { espnId: 2306, cbbdName: 'Kansas State', ncaaName: 'Kansas State' },
  2628: { espnId: 2628, cbbdName: 'Texas Christian', ncaaName: 'TCU' },
  248: { espnId: 248, cbbdName: 'Iowa State', ncaaName: 'Iowa State' },
  2086: { espnId: 2086, cbbdName: 'Houston', ncaaName: 'Houston' },

  // Big East
  269: { espnId: 269, cbbdName: 'Marquette', ncaaName: 'Marquette' },
  41: { espnId: 41, cbbdName: 'UConn', ncaaName: 'Connecticut' },
  222: { espnId: 222, cbbdName: 'Villanova', ncaaName: 'Villanova' },
  156: { espnId: 156, cbbdName: 'Creighton', ncaaName: 'Creighton' },
  2603: { espnId: 2603, cbbdName: "St. John's", ncaaName: "St. John's (NY)" },

  // Big Ten
  2509: { espnId: 2509, cbbdName: 'Purdue', ncaaName: 'Purdue' },
  127: { espnId: 127, cbbdName: 'Michigan State', ncaaName: 'Michigan State' },
  130: { espnId: 130, cbbdName: 'Michigan', ncaaName: 'Michigan' },
  356: { espnId: 356, cbbdName: 'Illinois', ncaaName: 'Illinois' },
  275: { espnId: 275, cbbdName: 'Wisconsin', ncaaName: 'Wisconsin' },
  120: { espnId: 120, cbbdName: 'Maryland', ncaaName: 'Maryland' },
  2483: { espnId: 2483, cbbdName: 'Oregon', ncaaName: 'Oregon' },
  26: { espnId: 26, cbbdName: 'UCLA', ncaaName: 'UCLA' },
  30: { espnId: 30, cbbdName: 'USC', ncaaName: 'USC' },

  // SEC
  333: { espnId: 333, cbbdName: 'Alabama', ncaaName: 'Alabama' },
  2633: { espnId: 2633, cbbdName: 'Tennessee', ncaaName: 'Tennessee' },
  2: { espnId: 2, cbbdName: 'Auburn', ncaaName: 'Auburn' },
  96: { espnId: 96, cbbdName: 'Kentucky', ncaaName: 'Kentucky' },
  57: { espnId: 57, cbbdName: 'Florida', ncaaName: 'Florida' },
  344: { espnId: 344, cbbdName: 'Mississippi State', ncaaName: 'Mississippi St.' },
  145: { espnId: 145, cbbdName: 'Ole Miss', ncaaName: 'Ole Miss' },
  245: { espnId: 245, cbbdName: 'Texas A&M', ncaaName: 'Texas A&M' },
  251: { espnId: 251, cbbdName: 'Texas', ncaaName: 'Texas' },
  201: { espnId: 201, cbbdName: 'Oklahoma', ncaaName: 'Oklahoma' },

  // WCC
  2250: { espnId: 2250, cbbdName: 'Gonzaga', ncaaName: 'Gonzaga' },

  // Mountain West
  21: { espnId: 21, cbbdName: 'San Diego State', ncaaName: 'San Diego St.' },

  // AAC
  235: { espnId: 235, cbbdName: 'Memphis', ncaaName: 'Memphis' },

  // A10
  2193: { espnId: 2193, cbbdName: 'Dayton', ncaaName: 'Dayton' },

  // MVC
  2181: { espnId: 2181, cbbdName: 'Drake', ncaaName: 'Drake' },
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
