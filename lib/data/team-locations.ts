/**
 * Geographic coordinates (lat/lng) for all 68 tournament teams.
 * Keyed by ESPN team ID. Used to calculate travel distance to tournament venues.
 */

export interface GeoCoord {
  lat: number;
  lng: number;
}

export const TEAM_LOCATIONS: Record<number, GeoCoord> = {
  // ── East Region ──
  150:  { lat: 36.0014, lng: -78.9382 },   // Duke — Durham, NC
  41:   { lat: 41.8077, lng: -72.2540 },   // UConn — Storrs, CT
  127:  { lat: 42.7251, lng: -84.4791 },   // Michigan State — East Lansing, MI
  2305: { lat: 38.9543, lng: -95.2528 },   // Kansas — Lawrence, KS
  2599: { lat: 40.7282, lng: -73.9942 },   // St. John's — Queens, NY
  97:   { lat: 38.2170, lng: -85.7585 },   // Louisville — Louisville, KY
  26:   { lat: 34.0689, lng: -118.4452 },  // UCLA — Los Angeles, CA
  194:  { lat: 40.0066, lng: -83.0305 },   // Ohio State — Columbus, OH
  2628: { lat: 32.7555, lng: -97.3308 },   // TCU — Fort Worth, TX
  2116: { lat: 28.6024, lng: -81.2001 },   // UCF — Orlando, FL
  58:   { lat: 28.0587, lng: -82.4139 },   // South Florida — Tampa, FL
  2460: { lat: 42.5134, lng: -92.4618 },   // Northern Iowa — Cedar Falls, IA
  2856: { lat: 33.9261, lng: -117.4297 },  // California Baptist — Riverside, CA
  2449: { lat: 46.8772, lng: -96.7898 },   // North Dakota State — Fargo, ND
  231:  { lat: 34.9249, lng: -82.4382 },   // Furman — Greenville, SC
  2561: { lat: 42.7180, lng: -73.6919 },   // Siena — Loudonville, NY

  // ── West Region ──
  12:   { lat: 32.2319, lng: -110.9501 },  // Arizona — Tucson, AZ
  2509: { lat: 40.4237, lng: -86.9212 },   // Purdue — West Lafayette, IN
  2250: { lat: 47.6667, lng: -117.4023 },  // Gonzaga — Spokane, WA
  8:    { lat: 36.0679, lng: -94.1737 },   // Arkansas — Fayetteville, AR
  275:  { lat: 43.0753, lng: -89.4034 },   // Wisconsin — Madison, WI
  252:  { lat: 40.2338, lng: -111.6585 },  // BYU — Provo, UT
  2390: { lat: 25.7190, lng: -80.2799 },   // Miami (FL) — Coral Gables, FL
  222:  { lat: 40.0340, lng: -75.3456 },   // Villanova — Villanova, PA
  328:  { lat: 41.7520, lng: -111.8338 },  // Utah State — Logan, UT
  142:  { lat: 38.9404, lng: -92.3277 },   // Missouri — Columbia, MO
  152:  { lat: 35.7861, lng: -78.6821 },   // NC State — Raleigh, NC
  251:  { lat: 30.2849, lng: -97.7341 },   // Texas — Austin, TX
  2272: { lat: 35.9557, lng: -80.0053 },   // High Point — High Point, NC
  62:   { lat: 21.2969, lng: -157.8171 },  // Hawaii — Honolulu, HI
  338:  { lat: 34.0388, lng: -84.5880 },   // Kennesaw State — Kennesaw, GA
  2511: { lat: 35.2463, lng: -80.7445 },   // Queens — Charlotte, NC
  112358: { lat: 40.6892, lng: -73.8920 }, // Long Island — Brooklyn, NY

  // ── South Region ──
  57:   { lat: 29.6520, lng: -82.3250 },   // Florida — Gainesville, FL
  248:  { lat: 29.7199, lng: -95.3422 },   // Houston — Houston, TX
  356:  { lat: 40.1020, lng: -88.2272 },   // Illinois — Champaign, IL
  158:  { lat: 40.8202, lng: -96.7005 },   // Nebraska — Lincoln, NE
  238:  { lat: 36.1447, lng: -86.8027 },   // Vanderbilt — Nashville, TN
  153:  { lat: 35.9049, lng: -79.0469 },   // North Carolina — Chapel Hill, NC
  2608: { lat: 37.8463, lng: -122.4625 },  // Saint Mary's — Moraga, CA
  228:  { lat: 34.6834, lng: -82.8374 },   // Clemson — Clemson, SC
  2294: { lat: 41.6611, lng: -91.5302 },   // Iowa — Iowa City, IA
  245:  { lat: 30.6187, lng: -96.3365 },   // Texas A&M — College Station, TX
  2670: { lat: 37.5485, lng: -77.4530 },   // VCU — Richmond, VA
  2377: { lat: 30.2453, lng: -93.2108 },   // McNeese — Lake Charles, LA
  2653: { lat: 31.7983, lng: -85.9664 },   // Troy — Troy, AL
  219:  { lat: 39.9522, lng: -75.1932 },   // Penn — Philadelphia, PA
  70:   { lat: 46.7324, lng: -117.0002 },  // Idaho — Moscow, ID
  2329: { lat: 40.6084, lng: -75.3781 },   // Lehigh — Bethlehem, PA
  2504: { lat: 30.0930, lng: -95.9910 },   // Prairie View A&M — Prairie View, TX

  // ── Midwest Region ──
  130:  { lat: 42.2681, lng: -83.7474 },   // Michigan — Ann Arbor, MI
  66:   { lat: 42.0266, lng: -93.6465 },   // Iowa State — Ames, IA
  258:  { lat: 38.0336, lng: -78.5080 },   // Virginia — Charlottesville, VA
  333:  { lat: 33.2098, lng: -87.5692 },   // Alabama — Tuscaloosa, AL
  2641: { lat: 33.5843, lng: -101.8456 },  // Texas Tech — Lubbock, TX
  2633: { lat: 35.9544, lng: -83.9295 },   // Tennessee — Knoxville, TN
  96:   { lat: 38.0317, lng: -84.5040 },   // Kentucky — Lexington, KY
  61:   { lat: 33.9480, lng: -83.3773 },   // Georgia — Athens, GA
  139:  { lat: 38.6396, lng: -90.2346 },   // Saint Louis — St. Louis, MO
  2541: { lat: 37.3483, lng: -121.9390 },  // Santa Clara — Santa Clara, CA
  2567: { lat: 32.8411, lng: -96.7823 },   // SMU — Dallas, TX
  193:  { lat: 39.5070, lng: -84.7453 },   // Miami (OH) — Oxford, OH
  2006: { lat: 41.0750, lng: -81.5117 },   // Akron — Akron, OH
  2275: { lat: 40.7142, lng: -73.6003 },   // Hofstra — Hempstead, NY
  2750: { lat: 39.7805, lng: -84.0604 },   // Wright State — Dayton, OH
  2634: { lat: 36.1636, lng: -86.8312 },   // Tennessee State — Nashville, TN
  2378: { lat: 39.2554, lng: -76.7108 },   // UMBC — Catonsville, MD
  47:   { lat: 38.9227, lng: -77.0196 },   // Howard — Washington, DC
};
