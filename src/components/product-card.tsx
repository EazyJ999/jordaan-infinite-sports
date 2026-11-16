import { Link } from "@tanstack/react-router";
import { availabilityLabel, categoryLabel, formatMoney, seasonText, type Product } from "@/data/catalog";

export function ProductCard({ product }: { product: Product }) {
  const ready = product.availability === "on_hand" && product.stock > 0;
  const stockNote = ready ? (product.stock <= 4 ? `${product.stock} ready` : "Ready to send") : "To order";

  return (
    <Link to="/product/$slug" params={{ slug: product.slug }} className="block">
      <div className="frame-kit overflow-hidden bg-[#0e0e0e]">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-contain"
        />
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