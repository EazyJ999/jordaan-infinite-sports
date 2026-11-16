/** Weekend of 27–29 November 2026. Betway Premiership kick-offs, South African time. Times can still move. */
export const SCORE_FEE = 100;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** The R100 draw is open in the first 7 days and the last 7 days of every month (South African time). */
export function scoreWindow(now = new Date()) {
  const sast = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const year = sast.getUTCFullYear();
  const month = sast.getUTCMonth();
  const day = sast.getUTCDate();
  const last = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const first = day <= 7;
  const end = day >= last - 6;
  const open = first || end;
  const name = MONTHS[month] ?? "";
  const label = first ? `1–7 ${name} ${year}` : end ? `${last - 6}–${last} ${name} ${year}` : "";
  const id = `${year}-${String(month + 1).padStart(2, "0")}-${first ? "first" : end ? "last" : "closed"}`;
  let next = "";
  if (!open) {
    if (day < last - 6) next = `${last - 6}–${last} ${name} ${year}`;
    else {
      const nextMonth = (month + 1) % 12;
      const nextYear = month === 11 ? year + 1 : year;
      next = `1–7 ${MONTHS[nextMonth]} ${nextYear}`;
    }
  }
  return { open, id, label, next };
}

export function penaltyRound(now = new Date()) {
  const sast = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const year = sast.getUTCFullYear();
  const month = sast.getUTCMonth();
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export type BoardGame = {
  id: string;
  sport: string;
  when: string;
  home: string;
  away: string;
  form: string;
  lean: string;
  score: string;
};

/** Seven Betway Premiership matches for the shirt draw. Kick-offs are South African time. */
export const SCORE_GAMES: BoardGame[] = [
  {
    id: "ste-tsg",
    sport: "Football",
    when: "Fri 27 Nov · 19:30",
    home: "Stellenbosch",
    away: "TS Galaxy",
    form: "Betway Premiership. Danie Craven Stadium.",
    lean: "",
    score: "",
  },
  {
    id: "ama-mil",
    sport: "Football",
    when: "Sat 28 Nov · 15:30",
    home: "AmaZulu",
    away: "Milford",
    form: "Betway Premiership. Moses Mabhida Stadium.",
    lean: "",
    score: "",
  },
  {
    id: "chi-chi",
    sport: "Football",
    when: "Sat 28 Nov · 15:30",
    home: "Chippa United",
    away: "Kaizer Chiefs",
    form: "Betway Premiership. Nelson Mandela Bay Stadium.",
    lean: "",
    score: "",
  },
  {
    id: "pir-arr",
    sport: "Football",
    when: "Sat 28 Nov · 18:00",
    home: "Orlando Pirates",
    away: "Golden Arrows",
    form: "Betway Premiership. Orlando Stadium.",
    lean: "",
    score: "",
  },
  {
    id: "kru-sun",
    sport: "Football",
    when: "Sat 28 Nov · 20:15",
    home: "Kruger United",
    away: "Mamelodi Sundowns",
    form: "Betway Premiership. Mbombela Stadium.",
    lean: "",
    score: "",
  },
  {
    id: "gal-bay",
    sport: "Football",
    when: "Sun 29 Nov · 15:30",
    home: "Marumo Gallants",
    away: "Richards Bay",
    form: "Betway Premiership. Royal Bafokeng Stadium.",
    lean: "",
    score: "",
  },
  {
    id: "sek-siw",
    sport: "Football",
    when: "Sun 29 Nov · 18:00",
    home: "Sekhukhune United",
    away: "Siwelele",
    form: "Betway Premiership. Peter Mokaba Stadium.",
    lean: "",
    score: "",
  },
];

const RUGBY: BoardGame[] = [
  {
    id: "fra-rsa",
    sport: "Rugby",
    when: "Fri 13 Nov · 22:10",
    home: "France",
    away: "South Africa",
    form: "Nations Championship. South Africa are 4 from 4 with a +140 points difference, including 66-7 against Italy. France lead the north on 17 points.",
    lean: "South Africa",
    score: "22-27",
  },
  {
    id: "wal-nzl",
    sport: "Rugby",
    when: "Sat 14 Nov",
    home: "Wales",
    away: "New Zealand",
    form: "New Zealand are also 4 from 4. Wales are 2 from 4 and behind on points difference.",
    lean: "New Zealand",
    score: "13-34",
  },
  {
    id: "eng-jpn",
    sport: "Rugby",
    when: "Sat 14 Nov",
    home: "England",
    away: "Japan",
    form: "England are 3 wins from 4. Japan are 1 from 4.",
    lean: "England",
    score: "34-15",
  },
  {
    id: "ire-fij",
    sport: "Rugby",
    when: "Sat 14 Nov",
    home: "Ireland",
    away: "Fiji",
    form: "Ireland are 3 from 4. Fiji are yet to win in the championship.",
    lean: "Ireland",
    score: "41-12",
  },
  {
    id: "sco-aus",
    sport: "Rugby",
    when: "Sun 15 Nov",
    home: "Scotland",
    away: "Australia",
    form: "Scotland are 2 from 4 at home. Australia are 1 from 4.",
    lean: "Scotland",
    score: "22-18",
  },
  {
    id: "ita-arg",
    sport: "Rugby",
    when: "Sat 14 Nov",
    home: "Italy",
    away: "Argentina",
    form: "Italy are 0 from 4 and lost 7-66 to South Africa last week. Argentina have one win.",
    lean: "Argentina",
    score: "14-27",
  },
];

const NFL: BoardGame[] = [
  {
    id: "ne-det",
    sport: "NFL",
    when: "Sun 15 Nov",
    home: "Detroit",
    away: "New England",
    form: "Detroit are 6-2, New England 5-4, in Munich. The published spread was Detroit -2.5.",
    lean: "Detroit",
    score: "—",
  },
  {
    id: "kc-atl",
    sport: "NFL",
    when: "Sun 15 Nov",
    home: "Atlanta",
    away: "Kansas City",
    form: "Kansas City are 6-2. Atlanta are 3-6. Published spread was Kansas City -3.5.",
    lean: "Kansas City",
    score: "—",
  },
  {
    id: "buf-nyj",
    sport: "NFL",
    when: "Sun 15 Nov",
    home: "NY Jets",
    away: "Buffalo",
    form: "Published spread was Buffalo -7.5.",
    lean: "Buffalo",
    score: "—",
  },
  {
    id: "sf-dal",
    sport: "NFL",
    when: "Sun 15 Nov",
    home: "Dallas",
    away: "San Francisco",
    form: "Published spread was San Francisco -4.5.",
    lean: "San Francisco",
    score: "—",
  },
];

export const WEEKEND_BOARD: BoardGame[] = [...RUGBY, ...NFL, ...SCORE_GAMES];

/** Recent results and called scores for the top bar. */
export const SCORE_HIGHLIGHTS = [
  "Italy 7–66 South Africa · Nations Championship",
  "Washington 24–21 Giants · NFL Thursday",
  "France vs South Africa · possible 22-27",
  "Norway vs Wales · possible 2-1",
  "Portugal vs Denmark · possible 2-1",
  "Wales vs New Zealand · possible 13-34",
  "England vs Japan · possible 34-15",
];
