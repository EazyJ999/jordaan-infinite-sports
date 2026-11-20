import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { availabilityLabel, categoryLabel, formatMoney, seasonText, type Product } from "@/data/catalog";

function KitPhotos({ shots, alt }: { shots: string[]; alt: string }) {
  const [index, setIndex] = useState(0);
  const count = shots.length;

  useEffect(() => {
    if (count < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, 2800);
    return () => window.clearInterval(timer);
  }, [count]);

  return (
    <img
      src={shots[index % count] ?? shots[0]}
      alt={alt}
      className="h-full w-full object-contain"
    />
  );
}

export function ProductCard({ product }: { product: Product }) {
  const ready = product.availability === "on_hand" && product.stock > 0;
  const stockNote = ready ? (product.stock <= 4 ? `${product.stock} ready` : "Ready to send") : "To order";
  const shots = [...new Set([product.image, ...(product.gallery ?? [])].filter(Boolean))];

  return (
    <Link to="/product/$slug" params={{ slug: product.slug }} className="block">
      <div className="frame-kit overflow-hidden bg-[#0e0e0e]">
        <KitPhotos shots={shots} alt={product.name} />
      </div>
      <p className="mt-3 text-xs text-muted">
        {categoryLabel(product.category)}
        {product.season ? ` · ${seasonText(product.season)}` : ""} · {product.team}
      </p>
      <h3 className="mt-1 text-lg leading-snug">{product.name}</h3>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="text-sm tabular-nums">{formatMoney(product.price)}</p>
        <p className={`text-xs ${ready ? "text-brass" : "text-muted"}`}>{stockNote}</p>
      </div>
      <p className="sr-only">{availabilityLabel(product.availability)}. Open to choose a size and add to bag.</p>
    </Link>
  );
}