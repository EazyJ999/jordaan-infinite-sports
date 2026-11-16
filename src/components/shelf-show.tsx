import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CATEGORIES, type Product } from "@/data/catalog";

type Slide = { src: string; slug: string; name: string; shelf: string };

function sastDay(date = new Date()) {
  return new Date(date.getTime() + 2 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function hashSeed(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number) {
  let state = seed || 1;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], random: () => number) {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const swap = next[i];
    next[i] = next[j]!;
    next[j] = swap!;
  }
  return next;
}

export function shotsOf(product: Product) {
  return [product.image, ...(product.gallery ?? [])].filter((src) => src.length > 0);
}

/** One picture from each shelf, then the next, until every photo has been shown. Order changes once a day. */
export function shelfDeck(products: Product[], day = sastDay()) {
  const random = mulberry32(hashSeed(`${day}:${products.length}`));
  const queues = CATEGORIES.map((category) => {
    const slides: Slide[] = [];
    for (const product of products) {
      if (product.category !== category.id) continue;
      for (const src of shotsOf(product)) {
        slides.push({ src, slug: product.slug, name: product.name, shelf: category.label });
      }
    }
    return shuffle(slides, random);
  }).filter((queue) => queue.length > 0);

  const deck: Slide[] = [];
  let pending = true;
  while (pending) {
    pending = false;
    for (const queue of queues) {
      const slide = queue.shift();
      if (!slide) continue;
      deck.push(slide);
      pending = true;
    }
  }
  return deck;
}

export function dailyShelfPhoto(products: Product[], categoryId: string, day = sastDay()) {
  const shots = products.filter((product) => product.category === categoryId).flatMap(shotsOf);
  if (shots.length === 0) return null;
  const index = hashSeed(`${day}:${categoryId}`) % shots.length;
  return shots[index] ?? null;
}

export function ShelfShow({ products }: { products: Product[] }) {
  const slides = useMemo(() => shelfDeck(products), [products]);
  const [index, setIndex] = useState(0);
  const count = slides.length;
  const slide = count > 0 ? slides[index % count] : undefined;

  useEffect(() => {
    if (count < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, 3800);
    return () => window.clearInterval(timer);
  }, [count]);

  if (!slide) {
    return <div className="frame-hero bg-[#0e0e0e]" />;
  }

  return (
    <div>
      <Link
        to="/product/$slug"
        params={{ slug: slide.slug }}
        className="relative block overflow-hidden bg-[#0e0e0e] frame-hero"
      >
        <img src={slide.src} alt="" className="h-full w-full object-contain" />
      </Link>
      <p className="mt-2 text-xs text-brass">{slide.shelf}</p>
      <p className="text-sm">{slide.name}</p>
    </div>
  );
}
