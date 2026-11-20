import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const FILE = "/workspace/data/price-book.json";

export type PriceBook = Record<string, number>;

function parseBook(raw: string | null | undefined): PriceBook {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const book: PriceBook = {};
    for (const [slug, price] of Object.entries(parsed)) {
      const amount = Number(price);
      if (!slug || !Number.isInteger(amount) || amount < 1 || amount > 50000) continue;
      book[slug] = amount;
    }
    return book;
  } catch {
    return {};
  }
}

export function readPriceFile(): PriceBook {
  try {
    return parseBook(readFileSync(FILE, "utf8"));
  } catch {
    return {};
  }
}

export function writePriceFile(book: PriceBook) {
  try {
    mkdirSync(dirname(FILE), { recursive: true });
    writeFileSync(FILE, JSON.stringify(book));
  } catch {
    // The live shop database still has the price when the disk cannot be written.
  }
}

export { parseBook };
