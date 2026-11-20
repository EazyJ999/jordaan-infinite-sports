import type { SizeChartId } from "@/data/size-charts";
import { MLB_SEEDS } from "@/data/mlb";
import { POLO_SEEDS } from "@/data/polos";
import { RUGBY_SEEDS } from "@/data/rugby";

export type Category =
  | "new"
  | "leagues"
  | "polos"
  | "retro"
  | "retro-jackets"
  | "long-sleeves"
  | "windbreaker"
  | "hoodies"
  | "tracksuits"
  | "full-tracksuit"
  | "puffer"
  | "intl-retro"
  | "clubs-retro"
  | "beanies"
  | "banners"
  | "gloves"
  | "keychains"
  | "scarfs"
  | "match-flag"
  | "shin-pads"
  | "footballs"
  | "socks"
  | "f1"
  | "nfl"
  | "mlb"
  | "boots"
  | "local"
  | "babies"
  | "rugby"
  | "international";

export type Availability = "on_hand" | "to_order";
export type Region = "international";
export type Kind = "jersey";

export const JERSEY_PRICE = 800;
export const RETRO_PRICE = 850;
export const TRAINING_PRICE = 800;
export const F1_PRICE = 850;
export const WIND_PRICE = 900;
export const PUFFER_PRICE = 1100;
export const HOODIE_PRICE = 750;
export const TRACKSUIT_PRICE = 1200;
export const BEANIE_PRICE = 250;
export const SCARF_PRICE = 280;
export const GLOVE_PRICE = 250;
export const SOCK_PRICE = 150;
export const KEYCHAIN_PRICE = 80;
export const FLAG_PRICE = 350;
export const SHIN_PRICE = 280;
export const BALL_PRICE = 350;

export type ShirtVersion = "player" | "fan";
export type Offer = "stock" | "single";

export function listPrice(category: Category): number | null {
  if (category === "retro" || category === "clubs-retro" || category === "intl-retro") return RETRO_PRICE;
  if (category === "f1") return F1_PRICE;
  if (category === "retro-jackets" || category === "windbreaker") return WIND_PRICE;
  if (category === "puffer") return PUFFER_PRICE;
  if (category === "hoodies") return HOODIE_PRICE;
  if (category === "tracksuits" || category === "full-tracksuit") return TRACKSUIT_PRICE;
  if (category === "beanies") return BEANIE_PRICE;
  if (category === "scarfs") return SCARF_PRICE;
  if (category === "gloves") return GLOVE_PRICE;
  if (category === "socks") return SOCK_PRICE;
  if (category === "keychains") return KEYCHAIN_PRICE;
  if (category === "banners" || category === "match-flag") return FLAG_PRICE;
  if (category === "shin-pads") return SHIN_PRICE;
  if (category === "footballs") return BALL_PRICE;
  if (category === "boots" || category === "babies") return null;
  return JERSEY_PRICE;
}

/** Start years for a shirt season, 1900/01 through 2030/31. */
export const SEASON_YEARS = Array.from({ length: 2030 - 1900 + 1 }, (_, index) => 1900 + index);

export function seasonCode(startYear: number) {
  const end = startYear + 1;
  return `${String(startYear % 100).padStart(2, "0")}/${String(end % 100).padStart(2, "0")}`;
}

export function seasonYear(code: string): number | null {
  const match = /^(\d{2})\/(\d{2})$/.exec(code.trim());
  if (!match) return null;
  const pair = `${match[1]}/${match[2]}`;
  const years = SEASON_YEARS.filter((year) => seasonCode(year) === pair);
  return years.at(-1) ?? null;
}

export function seasonText(code: string) {
  const start = seasonYear(code);
  if (start == null) return "";
  return `${seasonCode(start)} (${start}–${start + 1})`;
}

export function normalizeSeason(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return "";
  const start = seasonYear(trimmed);
  if (start == null) return null;
  return seasonCode(start);
}

export function isShirtVersion(value: unknown): value is ShirtVersion {
  return value === "player" || value === "fan";
}

export function isOffer(value: unknown): value is Offer {
  return value === "stock" || value === "single";
}

export function versionLabel(_version: string | undefined) {
  return "";
}

export function offerLabel(_offer: string | undefined) {
  return "";
}

export function shirtPrice(product: { price: number }, _version?: ShirtVersion, _size?: string, _offer?: Offer) {
  return product.price;
}

export function hasFanVersion(_product: { price: number; fanPrice: number }) {
  return false;
}

export function canBuyFromStock(product: { availability: Availability; stock: number }) {
  return product.availability === "on_hand" && product.stock > 0;
}

export function lineOffer(_line: { offer?: string }, product: { availability: Availability; stock: number }): Offer {
  return canBuyFromStock(product) ? "stock" : "single";
}

export type Product = {
  slug: string;
  name: string;
  team: string;
  category: Category;
  availability: Availability;
  region: Region;
  kind: Kind;
  price: number;
  fanPrice: number;
  boxPrice: number | null;
  boxFanPrice: number | null;
  image: string;
  /** More angles of the same kit. The card uses image. */
  gallery?: string[];
  blurb: string;
  stock: number;
  sizes: string[];
  sizeChart: SizeChartId;
  printable: boolean;
  season: string;
};

export const CATEGORIES: { id: Category; label: string; nav: string; short: string; images: string[] }[] = [
  {
    id: "leagues",
    label: "League Kits 26/27",
    nav: "League Kits 26/27",
    short: "26/27",
    images: [
      "/leagues/premier-league.png",
      "/leagues/laliga.png",
      "/leagues/bundesliga.png",
      "/leagues/ligue-1.png",
      "/leagues/serie-a.png",
      "/leagues/saudi.png",
    ],
  },
  { id: "polos", label: "Polo Shirts", nav: "Polos", short: "POLO", images: ["/catalog/polos/shelf.jpg"] },
  { id: "long-sleeves", label: "Long Sleeves", nav: "Long sleeves", short: "LS", images: ["/categories/new.jpg"] },
  { id: "windbreaker", label: "Double Sided Windbreaker", nav: "Windbreaker", short: "WIND", images: ["/categories/jackets.jpg"] },
  { id: "hoodies", label: "Hoodies", nav: "Hoodies", short: "HOOD", images: ["/categories/tracksuits.jpg"] },
  { id: "tracksuits", label: "Tracksuits", nav: "Track", short: "TRK", images: ["/categories/tracksuits.jpg"] },
  { id: "full-tracksuit", label: "Full Track Suit", nav: "Full kit", short: "FULL", images: ["/categories/tracksuits.jpg"] },
  { id: "puffer", label: "Puffer Jackets", nav: "Puffer", short: "PUFF", images: ["/categories/jackets.jpg"] },
  { id: "retro-jackets", label: "Retro Jackets", nav: "Jackets", short: "JKT", images: ["/categories/jackets.jpg"] },
  { id: "intl-retro", label: "International Retro", nav: "Intl retro", short: "INT", images: ["/categories/retro.jpg"] },
  { id: "clubs-retro", label: "Clubs Retro", nav: "Clubs retro", short: "CLB", images: ["/categories/retro.jpg"] },
  { id: "beanies", label: "Beanies", nav: "Beanies", short: "BEAN", images: ["/categories/new.jpg"] },
  { id: "banners", label: "Banners", nav: "Banners", short: "BAN", images: ["/categories/new.jpg"] },
  { id: "gloves", label: "Gloves", nav: "Gloves", short: "GLV", images: ["/categories/new.jpg"] },
  { id: "keychains", label: "Keychains", nav: "Keychains", short: "KEY", images: ["/categories/new.jpg"] },
  { id: "scarfs", label: "Scarfs", nav: "Scarfs", short: "SCF", images: ["/categories/new.jpg"] },
  { id: "match-flag", label: "Match Flag", nav: "Flags", short: "FLAG", images: ["/categories/new.jpg"] },
  { id: "shin-pads", label: "Shin Pads", nav: "Shin pads", short: "SHIN", images: ["/categories/boots.jpg"] },
  { id: "footballs", label: "Footballs", nav: "Footballs", short: "BALL", images: ["/categories/boots.jpg"] },
  { id: "socks", label: "Socks", nav: "Socks", short: "SOCK", images: ["/categories/new.jpg"] },
  { id: "f1", label: "Formula 1", nav: "F1", short: "F1", images: ["/leagues/f1.jpg"] },
  { id: "nfl", label: "NFL", nav: "NFL", short: "NFL", images: ["/leagues/nfl.jpg"] },
  { id: "mlb", label: "MLB", nav: "MLB", short: "MLB", images: ["/categories/mlb.jpg"] },
  { id: "boots", label: "Football Boots", nav: "Boots", short: "BOOT", images: ["/categories/boots.jpg"] },
  { id: "local", label: "Local is Lekker", nav: "Local", short: "SA", images: ["/categories/local.jpg"] },
  { id: "babies", label: "Babies", nav: "Babies", short: "BABY", images: ["/categories/babies.jpg"] },
  { id: "rugby", label: "Rugby", nav: "Rugby", short: "RUG", images: ["/categories/rugby.jpg"] },
  {
    id: "international",
    label: "International",
    nav: "Intl",
    short: "INT",
    images: [
      "/catalog/brazil98.jpg",
      "/catalog/france98.jpg",
      "/catalog/netherlands.jpg",
      "/catalog/argentina86.jpg",
      "/catalog/australia.jpg",
      "/catalog/india.jpg",
    ],
  },
];

export const TO_ORDER_NOTE =
  "It takes 3–4 days to make, then shipping takes 12–20 days. Allow 15–25 days from the order date.";

export const AVAILABILITY: { id: Availability; label: string; hint: string }[] = [
  { id: "on_hand", label: "On hand", hint: "Ready to send" },
  { id: "to_order", label: "Available to order", hint: "Made up once you order" },
];

export function isCategory(value: unknown): value is Category {
  return CATEGORIES.some((item) => item.id === value);
}

export function categoryLabel(id: string) {
  return CATEGORIES.find((item) => item.id === id)?.label ?? id;
}

/** Shelves with at least one kit. Empty shelves stay off the shop. */
export function stockedCategories(products: { category: string }[]) {
  const counts = new Map<string, number>();
  for (const product of products) counts.set(product.category, (counts.get(product.category) ?? 0) + 1);
  return CATEGORIES.filter((category) => (counts.get(category.id) ?? 0) > 0);
}

export function availabilityLabel(id: string) {
  return AVAILABILITY.find((item) => item.id === id)?.label ?? id;
}

export function coarseSport(category: Category) {
  if (category === "retro" || category === "retro-jackets" || category === "intl-retro" || category === "clubs-retro") return "retro";
  if (category === "nfl") return "nfl";
  if (category === "mlb") return "mlb";
  if (category === "rugby") return "rugby";
  if (category === "f1") return "f1";
  if (category === "tracksuits" || category === "full-tracksuit" || category === "hoodies" || category === "puffer") return "tracksuit";
  if (category === "boots") return "boots";
  if (category === "babies") return "baby";
  return "football";
}

export type ShopSort = "name" | "team" | "price-asc" | "price-desc";

export type ShopQuery = {
  category: string;
  availability: string;
  q: string;
  sort: ShopSort;
  team: string;
};

export function isShopSort(value: unknown): value is ShopSort {
  return value === "name" || value === "team" || value === "price-asc" || value === "price-desc";
}

export function shopQuery(
  category = "all",
  availability = "all",
  q = "",
  sort: ShopSort = "name",
  team = "all",
): ShopQuery {
  return { category, availability, q, sort, team };
}

export const RED_BULL_JACKET = "red-bull-racing-jacket";

export const RED_BULL_SHOTS = [
  { src: "/catalog/redbull/front.jpg", alt: "Red Bull Racing jacket, front" },
  { src: "/catalog/redbull/back.jpg", alt: "Red Bull Racing jacket, back" },
  { src: "/catalog/redbull/angle.jpg", alt: "Red Bull Racing jacket from the side" },
  { src: "/catalog/redbull/sleeve.jpg", alt: "Sleeve badges on the Red Bull Racing jacket" },
  { src: "/catalog/redbull/label.jpg", alt: "Neck label on the Red Bull Racing jacket" },
];

export const products: Product[] = [
  {
    slug: RED_BULL_JACKET,
    name: "Red Bull Racing jacket",
    team: "Red Bull Racing",
    category: "f1",
    availability: "to_order",
    region: "international",
    kind: "jersey",
    price: F1_PRICE,
    fanPrice: F1_PRICE,
    boxPrice: null,
    boxFanPrice: null,
    image: RED_BULL_SHOTS[0]!.src,
    blurb: "Navy Red Bull Racing softshell. Photos show the front, the back, the sleeve and the neck label.",
    stock: 0,
    sizes: ["S", "M", "L", "XL", "2XL", "3XL", "4XL"],
    sizeChart: "windbreaker",
    printable: false,
    season: "",
  },
  ...POLO_SEEDS.map((seed) => ({
    slug: `polo-${seed.slug}`,
    name: seed.name,
    team: seed.team,
    category: "polos" as const,
    availability: "to_order" as const,
    region: "international" as const,
    kind: "jersey" as const,
    price: TRAINING_PRICE,
    fanPrice: TRAINING_PRICE,
    boxPrice: null,
    boxFanPrice: null,
    image: `/catalog/polos/${seed.slug}.jpg`,
    blurb: seed.blurb,
    stock: 0,
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
    sizeChart: "training" as const,
    printable: true,
    season: "",
  })),
  ...RUGBY_SEEDS.map((seed) => ({
    slug: seed.slug,
    name: seed.name,
    team: seed.team,
    category: "rugby" as const,
    availability: "to_order" as const,
    region: "international" as const,
    kind: "jersey" as const,
    price: JERSEY_PRICE,
    fanPrice: JERSEY_PRICE,
    boxPrice: null,
    boxFanPrice: null,
    image: `/catalog/rugby/${seed.images[0]}`,
    gallery: seed.images.slice(1).map((file) => `/catalog/rugby/${file}`),
    blurb: seed.blurb,
    stock: 0,
    sizes: ["S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"],
    sizeChart: "rugby" as const,
    printable: true,
    season: seed.season,
  })),
  ...MLB_SEEDS.map((seed) => ({
    slug: seed.slug,
    name: seed.name,
    team: seed.team,
    category: "mlb" as const,
    availability: "to_order" as const,
    region: "international" as const,
    kind: "jersey" as const,
    price: JERSEY_PRICE,
    fanPrice: JERSEY_PRICE,
    boxPrice: null,
    boxFanPrice: null,
    image: `/catalog/mlb/${seed.file}`,
    blurb: `Team: ${seed.team}. Colour: ${seed.colour}. Year: ${seed.year}. Type: Short sleeve. ${seed.note}`,
    stock: 0,
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
    sizeChart: "mlb" as const,
    printable: false,
    season: seed.season,
  })),
];

export function getProduct(slug: string) {
  return products.find((p) => p.slug === slug);
}

export function filterProducts(list: Product[], opts: ShopQuery) {
  const q = opts.q.trim().toLowerCase();
  const team = opts.team && opts.team !== "all" ? opts.team : "";
  const matched = list.filter((p) => {
    if (opts.category !== "all" && p.category !== opts.category) return false;
    if (opts.availability !== "all" && p.availability !== opts.availability) return false;
    if (team && p.team !== team) return false;
    if (!q) return true;
    const hay = `${p.name} ${p.team} ${p.category} ${p.season} ${seasonText(p.season)} ${categoryLabel(p.category)} ${availabilityLabel(p.availability)} ${p.blurb}`.toLowerCase();
    return hay.includes(q);
  });
  const sort = opts.sort ?? "name";
  return matched.sort((a, b) => {
    if (sort === "team") return a.team.localeCompare(b.team) || a.name.localeCompare(b.name);
    if (sort === "price-asc") return a.price - b.price || a.name.localeCompare(b.name);
    if (sort === "price-desc") return b.price - a.price || a.name.localeCompare(b.name);
    return a.name.localeCompare(b.name);
  });
}

export type Delivery = "courier_guy" | "aramex" | "other" | "bloem" | "collection";

export const COURIER_FEE = 110;

export const SHOP_NAME = "J.I.S";
export const SHOP_FULL = "Jordaan Infinite Sports";
export const COLLECTION_ADDRESS = "6 Nobel Street, Brandwag, Bloemfontein";
export const COLLECTION_HOURS = "Weekdays after 17:30. Weekends from 07:00 to 20:00.";

export const DELIVERIES: { id: Delivery; label: string; detail: string; fee: number }[] = [
  { id: "courier_guy", label: "Courier Guy", detail: "R110 outside Bloem", fee: COURIER_FEE },
  { id: "aramex", label: "Aramex", detail: "R110 outside Bloem", fee: COURIER_FEE },
  { id: "other", label: "Other courier", detail: "Charged to you", fee: 0 },
  { id: "bloem", label: "Bloemfontein", detail: "Free, this city only", fee: 0 },
  { id: "collection", label: "Collect", detail: "Free in Brandwag", fee: 0 },
];

export function isDelivery(value: unknown): value is Delivery {
  return DELIVERIES.some((item) => item.id === value);
}

export function shippingFee(_subtotal: number, delivery: Delivery) {
  return DELIVERIES.find((item) => item.id === delivery)?.fee ?? COURIER_FEE;
}

export function deliveryName(delivery: string) {
  if (delivery === "courier") return "Courier Guy";
  return DELIVERIES.find((item) => item.id === delivery)?.label ?? "Courier";
}

export const ORDER_STATUSES = [
  { id: "received", label: "Received" },
  { id: "confirmed", label: "Confirmed" },
  { id: "printing", label: "Printing" },
  { id: "packed", label: "Packed" },
  { id: "sent", label: "With the courier" },
  { id: "ready", label: "Ready to collect" },
  { id: "done", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number]["id"];

export function isOrderStatus(value: unknown): value is OrderStatus {
  return ORDER_STATUSES.some((item) => item.id === value);
}

export function statusLabel(id: string) {
  return ORDER_STATUSES.find((item) => item.id === id)?.label ?? id;
}

export function isBloemfontein(city: string) {
  return city.toLowerCase().replace(/[^a-z]/g, "") === "bloemfontein";
}

export function phoneKey(phone: string) {
  return phone.replace(/\D/g, "").slice(-9);
}


export const PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
];

export function formatMoney(value: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(value);
}

