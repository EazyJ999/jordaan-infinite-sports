import { chartForCategory, type SizeChartId } from "@/data/size-charts";
import { seasonYear, type Category } from "@/data/catalog";

const COLOURS = [
  "black and white",
  "light blue",
  "pinstripe",
  "cream",
  "teal",
  "maroon",
  "mint",
  "navy",
  "royal",
  "black",
  "white",
  "green",
  "gold",
  "grey",
  "gray",
  "red",
  "blue",
  "yellow",
  "orange",
  "burgundy",
  "silver",
  "sky",
];

const LOCAL =
  /springbok|bafana|south africa|proteas|kaizer|orlando pirates|mamelodi|sundowns|amazulu|chippa|stellenbosch|siwelele|sekhukhune|golden arrows|ts galaxy|durban city|polokwane|richards bay|marumo|milford|kruger united|blue bulls|stormers|cheetahs|bloemfontein|supersport united/i;

const COUNTRY =
  /^(france|brazil|argentina|netherlands|germany|italy|spain|portugal|england|uruguay|mexico|japan|usa|united states|croatia|belgium|colombia|nigeria|morocco|senegal|ghana|cameroon|australia|india|wales|scotland|ireland|italy)$/i;

export function isLocalSide(team: string, name: string, category: string) {
  if (category === "nfl" || category === "mlb" || category === "f1") return false;
  return LOCAL.test(`${team} ${name}`);
}

export function garmentLabel(category: string, name: string) {
  const text = `${category} ${name}`.toLowerCase();
  if (/shorts/.test(text)) return "Shorts";
  if (category === "long-sleeves" || /long sleeve/.test(text)) return "Long sleeve";
  if (category === "windbreaker" || /windbreaker/.test(text)) return "Double sided windbreaker";
  if (category === "hoodies" || /hoodie/.test(text)) return "Hoodie";
  if (category === "puffer" || /puffer/.test(text)) return "Puffer jacket";
  if (category === "full-tracksuit" || category === "tracksuits" || /tracksuit|full kit|track suit/.test(text)) return "Full tracksuit";
  if (category === "retro-jackets" || /jacket/.test(text)) return "Jacket";
  if (category === "beanies" || /beanie/.test(text)) return "Beanie";
  if (category === "banners" || /banner/.test(text)) return "Banner";
  if (category === "gloves" || /glove/.test(text)) return "Gloves";
  if (category === "keychains" || /keychain|key ring/.test(text)) return "Keychain";
  if (category === "scarfs" || /scarf|scarves/.test(text)) return "Scarf";
  if (category === "match-flag" || /\bflag\b/.test(text)) return "Match flag";
  if (category === "shin-pads" || /shin/.test(text)) return "Shin pads";
  if (category === "footballs" || /football|soccer ball/.test(text)) return "Football";
  if (category === "socks" || /sock/.test(text)) return "Socks";
  if (category === "boots" || /boot/.test(text)) return "Boots";
  if (category === "polos" || /polo/.test(text)) return "Polo";
  if (/tee\b|t-shirt/.test(text)) return "Tee";
  return "Short sleeve";
}

export function colourLabel(name: string, blurb: string) {
  const stated = blurb.match(/Colour:\s*([^.]+)/i);
  if (stated?.[1] && stated[1].trim().toLowerCase() !== "see photo") {
    const clean = stated[1].trim();
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }
  const text = `${name} ${blurb}`.toLowerCase();
  const found = COLOURS.find((colour) => text.includes(colour));
  if (!found) return "See photo";
  if (found === "gray") return "Grey";
  if (found === "pinstripe") return "White pinstripe";
  return found.charAt(0).toUpperCase() + found.slice(1);
}

export function yearLabel(season: string, name: string, blurb: string) {
  const fromSeason = seasonYear(season);
  if (fromSeason) return String(fromSeason);
  const match = `${name} ${blurb}`.match(/\b(19|20)\d{2}\b/);
  return match ? match[0] : "Not listed";
}

export function shelfFor(category: string, team: string, name: string): Category {
  if (isLocalSide(team, name, category)) return "local";
  if (category === "new" || category === "retro") {
    if (COUNTRY.test(team.trim())) return "intl-retro";
    return "clubs-retro";
  }
  return category as Category;
}

export type KitFix = {
  name: string;
  team: string;
  category: Category;
  price: number;
  blurb: string;
  season: string;
  sizeChart: SizeChartId;
};

/** Team, colour, year and garment type. The price you type is left as it is. */
export function correctListing(input: {
  name: string;
  team: string;
  category: string;
  price: number;
  blurb: string;
  season: string;
}): KitFix {
  const team = input.team.trim() || input.name.trim();
  const category = shelfFor(input.category, team, input.name);
  const garment = garmentLabel(category === "local" ? input.category : category, input.name);
  const colour = colourLabel(input.name, input.blurb);
  const year = yearLabel(input.season, input.name, input.blurb);
  const facts = `Team: ${team}. Colour: ${colour}. Year: ${year}. Type: ${garment}.`;
  const extra = input.blurb
    .replace(/Team:.*?Type: [^.]+\.\s*/g, "")
    .trim();
  const blurb = `${facts}${extra ? ` ${extra}` : ""}`.slice(0, 400);
  const name = input.name.toLowerCase().includes(team.toLowerCase()) ? input.name.trim() : `${team} ${input.name.trim()}`.slice(0, 80);
  const sizeChart = input.category === "rugby" || category === "rugby" ? "rugby" : chartForCategory(category);
  return {
    name,
    team: team.slice(0, 60),
    category,
    price: input.price,
    blurb,
    season: input.season,
    sizeChart,
  };
}
