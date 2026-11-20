export type SizeChartId =
  | "player"
  | "retro"
  | "nba"
  | "nfl"
  | "nhl"
  | "mlb"
  | "rugby"
  | "kids"
  | "kids-tracksuit"
  | "baby"
  | "women"
  | "training"
  | "tshirt"
  | "tracksuit"
  | "jacket"
  | "windbreaker"
  | "boots";

export type SizeChart = {
  id: SizeChartId;
  title: string;
  blurb: string;
  columns: string[];
  rows: { label: string; values: string[] }[];
};

export const SIZE_CHARTS: SizeChart[] = [
  {
    id: "player",
    title: "Men’s jerseys",
    blurb: "Football shirts. Chest is the flat measurement across the front.",
    columns: ["S", "M", "L", "XL", "2XL"],
    rows: [
      { label: "Length (cm)", values: ["72", "74", "76", "78", "80"] },
      { label: "Chest (cm)", values: ["52", "54", "56", "58", "60"] },
      { label: "Shoulder (cm)", values: ["46", "48", "50", "52", "54"] },
      { label: "Sleeve (cm)", values: ["22", "23", "24", "25", "26"] },
      { label: "Height (cm)", values: ["165–170", "170–175", "175–180", "180–185", "185–190"] },
      { label: "Weight (kg)", values: ["55–65", "65–75", "75–85", "85–95", "95–105"] },
    ],
  },
  {
    id: "retro",
    title: "Retro jerseys",
    blurb: "Classic shirts. Chest is the flat measurement across the front.",
    columns: ["S", "M", "L", "XL", "2XL", "3XL", "4XL"],
    rows: [
      { label: "Length (cm)", values: ["71", "73", "75", "77", "79", "81", "83"] },
      { label: "Chest (cm)", values: ["51", "53", "55", "57", "59", "61", "63"] },
      { label: "Shoulder (cm)", values: ["44", "46", "48", "50", "52", "54", "56"] },
      { label: "Sleeve (cm)", values: ["22", "23", "24", "25", "26", "27", "28"] },
      { label: "Height (cm)", values: ["160–165", "165–170", "170–175", "175–180", "180–185", "185–190", "190–195"] },
      { label: "Weight (kg)", values: ["55–65", "60–70", "65–75", "70–80", "75–85", "80–90", "85–95"] },
    ],
  },
  {
    id: "nba",
    title: "Basketball jerseys",
    blurb: "NBA cut. The size number is the supplier’s cut, not a chest measurement.",
    columns: ["S", "M", "L", "XL", "2XL"],
    rows: [
      { label: "Cut", values: ["44", "46", "48", "50", "54"] },
      { label: "Height (cm)", values: ["170–175", "175–180", "180–185", "185–190", "190–195"] },
      { label: "Weight (kg)", values: ["60–70", "70–80", "80–90", "90–100", "100–110"] },
      { label: "Front length (cm)", values: ["76", "78", "80", "82", "84"] },
      { label: "Back length (cm)", values: ["78", "80", "82", "84", "86"] },
      { label: "Chest (cm)", values: ["52", "54", "56", "58", "60"] },
    ],
  },
  {
    id: "nfl",
    title: "NFL jerseys",
    blurb: "American football shirts. Chest is the flat measurement across the front.",
    columns: ["S", "M", "L", "XL", "2XL", "3XL", "4XL"],
    rows: [
      { label: "Height (cm)", values: ["170–175", "175–180", "180–185", "185–190", "190–195", "195–200", "200–205"] },
      { label: "Length (cm)", values: ["76", "78", "80", "82", "84", "86", "88"] },
      { label: "Sleeve (cm)", values: ["24", "25", "26", "27", "28", "29", "30"] },
      { label: "Chest (cm)", values: ["56", "58", "60", "62", "64", "66", "68"] },
    ],
  },
  {
    id: "nhl",
    title: "NHL jerseys",
    blurb: "Ice hockey shirts. Front and back lengths are both listed.",
    columns: ["S", "M", "L", "XL", "2XL", "3XL", "4XL"],
    rows: [
      { label: "Height (cm)", values: ["170–175", "175–180", "180–185", "185–190", "190–195", "195–200", "200–205"] },
      { label: "Front length (cm)", values: ["74", "76", "78", "80", "82", "84", "86"] },
      { label: "Back length (cm)", values: ["78", "80", "82", "84", "86", "88", "90"] },
      { label: "Chest (cm)", values: ["54", "56", "58", "60", "62", "64", "66"] },
    ],
  },
  {
    id: "mlb",
    title: "MLB jerseys",
    blurb: "Baseball shirts. Sleeve and cuff are measured on the short sleeve.",
    columns: ["S", "M", "L", "XL", "2XL", "3XL"],
    rows: [
      { label: "Height (cm)", values: ["170–175", "175–180", "180–185", "185–190", "190–195", "195–200"] },
      { label: "Length (cm)", values: ["74", "76", "78", "80", "82", "84"] },
      { label: "Sleeve (cm)", values: ["23", "24", "25", "26", "27", "28"] },
      { label: "Cuff (cm)", values: ["16", "17", "18", "19", "20", "21"] },
      { label: "Chest (cm)", values: ["54", "56", "58", "60", "62", "64"] },
    ],
  },
  {
    id: "rugby",
    title: "Rugby jerseys",
    blurb: "Rugby shirts. Chest is the flat measurement across the front.",
    columns: ["S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"],
    rows: [
      { label: "Height (cm)", values: ["165–170", "170–175", "175–180", "180–185", "185–190", "190–195", "195–200", "200–205"] },
      { label: "Length (cm)", values: ["72", "74", "76", "78", "80", "82", "84", "86"] },
      { label: "Chest (cm)", values: ["50", "52", "54", "56", "58", "60", "62", "64"] },
    ],
  },
  {
    id: "kids",
    title: "Kids’ jerseys",
    blurb: "The number is the kit size. The letter size is the same chart. Age is only a guide.",
    columns: ["16", "18", "20", "22", "24", "26", "28"],
    rows: [
      { label: "Letter", values: ["XXS", "XS", "S", "M", "L", "XL", "2XL"] },
      { label: "Age", values: ["3–4", "5–6", "6–7", "8–9", "10–11", "12", "13"] },
      { label: "Height (cm)", values: ["100", "110", "120", "130", "140", "150", "160"] },
      { label: "Length (cm)", values: ["46", "49", "52", "55", "58", "61", "64"] },
      { label: "1/2 bust (cm)", values: ["34", "37", "40", "43", "46", "49", "52"] },
      { label: "Shorts (cm)", values: ["32", "35", "38", "41", "44", "47", "50"] },
      { label: "1/2 waist (cm)", values: ["24", "26", "28", "30", "32", "34", "36"] },
    ],
  },
  {
    id: "kids-tracksuit",
    title: "Kids’ tracksuit and jacket",
    blurb: "Jacket and pants for ages that wear sizes 10 to 18.",
    columns: ["10", "12", "14", "16", "18"],
    rows: [
      { label: "Length (cm)", values: ["44", "46", "50", "52", "55"] },
      { label: "Chest (cm)", values: ["34", "37", "40", "43", "46"] },
      { label: "Sleeve (cm)", values: ["50", "54", "58", "62", "66"] },
      { label: "Pants (cm)", values: ["64", "68", "73", "78", "83"] },
      { label: "Waist (cm)", values: ["24", "26", "28", "30", "32"] },
      { label: "Height (cm)", values: ["100", "110", "120", "130", "140"] },
    ],
  },
  {
    id: "baby",
    title: "Baby",
    blurb: "Month sizes. Height and weight are a guide.",
    columns: ["9M", "12M"],
    rows: [
      { label: "Age", values: ["9–12 months", "12–18 months"] },
      { label: "Height (cm)", values: ["70–75", "75–85"] },
      { label: "Weight (kg)", values: ["7.5–8.5", "8.5–10"] },
    ],
  },
  {
    id: "women",
    title: "Women’s jerseys",
    blurb: "Women’s shirts. Chest is the flat measurement across the front.",
    columns: ["S", "M", "L", "XL", "2XL", "3XL", "4XL"],
    rows: [
      { label: "Length (cm)", values: ["67", "69", "71", "73", "75", "77", "79"] },
      { label: "Chest (cm)", values: ["47", "50", "53", "56", "59", "62", "65"] },
      { label: "Height (cm)", values: ["155–165", "160–170", "165–175", "170–180", "175–185", "175–185", "175–185"] },
      { label: "Weight (kg)", values: ["45–55", "50–60", "55–70", "65–80", "75–85", "80–95", "85–100"] },
    ],
  },
  {
    id: "training",
    title: "Training jerseys",
    blurb: "Training shirts. The pre-game set uses the same sizes.",
    columns: ["S", "M", "L", "XL", "2XL", "3XL"],
    rows: [
      { label: "Length (cm)", values: ["68", "70", "72", "74", "76", "78"] },
      { label: "Chest (cm)", values: ["50", "52", "54", "56", "58", "60"] },
      { label: "Sleeve (cm)", values: ["20", "21", "22", "23", "24", "25"] },
      { label: "Height (cm)", values: ["165–170", "170–175", "175–180", "180–185", "185–190", "190–195"] },
      { label: "Weight (kg)", values: ["55–65", "65–75", "75–85", "85–95", "95–105", "105–115"] },
    ],
  },
  {
    id: "tshirt",
    title: "Men’s t-shirts",
    blurb: "Plain and team t-shirts, including Formula 1 shirts.",
    columns: ["S", "M", "L", "XL", "2XL", "3XL"],
    rows: [
      { label: "Length (cm)", values: ["68", "70", "72", "74", "76", "78"] },
      { label: "Chest (cm)", values: ["48", "50", "52", "54", "56", "58"] },
      { label: "Shoulder (cm)", values: ["44", "46", "48", "50", "52", "54"] },
      { label: "Sleeve (cm)", values: ["20", "21", "22", "23", "24", "25"] },
      { label: "Height (cm)", values: ["165–170", "170–175", "175–180", "180–185", "185–190", "190–195"] },
      { label: "Weight (kg)", values: ["55–65", "65–75", "75–85", "85–95", "95–105", "105–115"] },
    ],
  },
  {
    id: "tracksuit",
    title: "Adult tracksuit",
    blurb: "Top only. For a jacket with pants, use the tracksuit and jacket chart.",
    columns: ["S", "M", "L", "XL", "2XL", "3XL", "4XL"],
    rows: [
      { label: "Length (cm)", values: ["70", "72", "74", "76", "78", "80", "82"] },
      { label: "Bust (cm)", values: ["51", "53", "55", "57", "59", "61", "63"] },
      { label: "Shoulder (cm)", values: ["44", "46", "48", "50", "52", "54", "56"] },
      { label: "Height (cm)", values: ["155–170", "165–175", "170–185", "180–195", "185–200", "185–200", "185–200"] },
      { label: "Weight (kg)", values: ["55–65", "60–75", "70–85", "80–100", "85–105", "90–110", "95–115"] },
    ],
  },
  {
    id: "jacket",
    title: "Adult tracksuit and jacket",
    blurb: "Jacket plus pants. Bust is the flat jacket measurement.",
    columns: ["S", "M", "L", "XL", "2XL", "3XL", "4XL"],
    rows: [
      { label: "Length (cm)", values: ["70", "72", "74", "76", "78", "80", "82"] },
      { label: "Bust (cm)", values: ["51", "53", "55", "57", "59", "61", "63"] },
      { label: "Shoulder (cm)", values: ["44", "46", "48", "50", "52", "54", "56"] },
      { label: "Pants length (cm)", values: ["98", "101", "103", "106", "108", "110", "112"] },
      { label: "Pants hip (cm)", values: ["50", "52", "54", "56", "58", "60", "62"] },
      { label: "Height (cm)", values: ["155–170", "165–175", "170–185", "180–195", "185–200", "185–200", "185–200"] },
      { label: "Weight (kg)", values: ["55–65", "60–75", "70–85", "80–100", "85–105", "90–110", "95–115"] },
    ],
  },
  {
    id: "windbreaker",
    title: "Retro jackets",
    blurb: "Windbreaker and coat. Sleeve is the full sleeve length.",
    columns: ["S", "M", "L", "XL", "2XL", "3XL", "4XL"],
    rows: [
      { label: "Length (cm)", values: ["68", "70", "72", "74", "76", "78", "80"] },
      { label: "Bust (cm)", values: ["54", "56", "58", "60", "62", "64", "66"] },
      { label: "Shoulder (cm)", values: ["46", "48", "50", "52", "54", "56", "58"] },
      { label: "Sleeve (cm)", values: ["62", "63", "64", "65", "66", "67", "68"] },
      { label: "Height (cm)", values: ["155–170", "165–175", "170–185", "180–195", "185–200", "185–200", "185–200"] },
      { label: "Weight (kg)", values: ["55–65", "60–75", "70–85", "80–100", "85–105", "90–110", "95–115"] },
    ],
  },
  {
    id: "boots",
    title: "Football boots",
    blurb: "UK sizes. Pick the size that matches a boot you already wear.",
    columns: ["5", "6", "7", "8", "9", "10", "11", "12", "13"],
    rows: [],
  },
];

export function isSizeChart(value: unknown): value is SizeChartId {
  return SIZE_CHARTS.some((chart) => chart.id === value);
}

export function chartById(id: string) {
  return SIZE_CHARTS.find((chart) => chart.id === id) ?? SIZE_CHARTS[0]!;
}

export function sizesFor(id: SizeChartId) {
  return chartById(id).columns;
}

export function chartForCategory(category: string): SizeChartId {
  if (category === "nfl") return "nfl";
  if (category === "mlb") return "mlb";
  if (category === "rugby") return "rugby";
  if (category === "retro" || category === "intl-retro" || category === "clubs-retro") return "retro";
  if (category === "retro-jackets" || category === "windbreaker" || category === "puffer") return "windbreaker";
  if (category === "tracksuits" || category === "full-tracksuit" || category === "hoodies") return "jacket";
  if (category === "f1") return "tshirt";
  if (category === "babies") return "baby";
  if (category === "boots") return "boots";
  if (category === "polos") return "training";
  if (category === "beanies" || category === "scarfs" || category === "gloves" || category === "socks" || category === "keychains" || category === "banners" || category === "match-flag") {
    return "tshirt";
  }
  return "player";
}

const PLAIN_CHARTS = new Set(["jacket", "tracksuit", "kids-tracksuit", "windbreaker", "baby", "boots"]);

export function chartAllowsPrint(id: string) {
  return !PLAIN_CHARTS.has(id);
}

export const PRINT_BADGES = [
  { id: "club", label: "Club badge" },
  { id: "league", label: "League patch" },
  { id: "sleeve", label: "Sleeve badge" },
] as const;

export function cleanPrintName(input: string) {
  let letters = 0;
  let out = "";
  for (const ch of input.replace(/[^a-zA-Z ]/g, "")) {
    if (/[a-zA-Z]/.test(ch)) {
      if (letters >= 12) continue;
      letters += 1;
    }
    out += ch;
  }
  return out.replace(/ {2,}/g, " ").replace(/^ /, "");
}

export function cleanPrintNumber(input: string) {
  return input.replace(/\D/g, "").slice(0, 2);
}
