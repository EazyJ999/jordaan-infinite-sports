import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { JacketReel } from "@/components/jacket-reel";
import { SizeChartTable, SizeNote } from "@/components/size-chart";
import { COLLECTION_ADDRESS, COLLECTION_HOURS, COURIER_FEE, RED_BULL_JACKET, categoryLabel, formatMoney, seasonText, shopQuery } from "@/data/catalog";
import { NoReturnNotice } from "@/components/no-return";
import { useShop } from "@/lib/store";
import { useCatalog } from "@/lib/catalog-context";

export const Route = createFileRoute("/product/$slug")({
  head: ({ params }) => ({
    meta: [{ title: `${params.slug.replace(/-/g, " ")} · J.I.S` }],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { products } = useCatalog();
  const product = products.find((item) => item.slug === slug);
  const add = useShop((s) => s.add);
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState("");
  const [photo, setPhoto] = useState(0);

  useEffect(() => {
    setPhoto(0);
  }, [product?.slug]);

  if (!product) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16">
        <h1 className="text-5xl uppercase">That kit is not on the rail</h1>
        <Link to="/shop" search={shopQuery()} className="btn btn-primary mt-6">
          Back to shop
        </Link>
      </main>
    );
  }

  const related = products.filter((item) => item.category === product.category && item.slug !== product.slug).slice(0, 4);
  const inStock = product.availability === "on_hand" && product.stock > 0;
  const maxQty = inStock ? Math.max(1, Math.min(product.stock, 6)) : 6;
  const shots =
    product.slug === RED_BULL_JACKET && !(product.gallery && product.gallery.length > 0)
      ? null
      : [...new Set([product.image, ...(product.gallery ?? [])].filter(Boolean))];
  const shot = shots ? shots[Math.min(photo, shots.length - 1)] ?? shots[0] : "";

  function addToBag() {
    if (!size) {
      setError("Choose a size first.");
      return;
    }
    setError("");
    add(product!.slug, size, qty, "player", inStock ? "stock" : "single");
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <p className="text-xs uppercase tracking-widest text-muted">
        <Link to="/shop" search={shopQuery(product.category)} className="underline">
          {categoryLabel(product.category)}
        </Link>
        {" · "}
        {product.team}
        {product.season ? ` · ${seasonText(product.season)}` : ""}
      </p>
      <div className="mt-4 grid items-start gap-8 lg:grid-cols-2">
        {product.slug === RED_BULL_JACKET && !shots ? (
          <JacketReel />
        ) : (
          <div>
            <img src={shot} alt={product.name} className="frame-kit w-full bg-[#0e0e0e] object-contain" />
            {shots && shots.length > 1 ? (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {shots.map((src, index) => (
                  <button
                    key={`${index}-${src.slice(0, 32)}`}
                    type="button"
                    onClick={() => setPhoto(index)}
                    className={`h-16 w-12 shrink-0 border bg-[#0e0e0e] ${index === photo ? "border-ink" : "border-line"}`}
                    aria-label={`Photo ${index + 1}`}
                  >
                    <img src={src} alt="" className="h-full w-full object-contain" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        )}
        <div>
          <h1 className="text-5xl uppercase leading-none">{product.name}</h1>
          <p className="mt-3 text-muted">{product.blurb}</p>
          <p className="mt-4 font-display text-4xl tabular-nums">{formatMoney(product.price)}</p>
          <p className="mt-2 text-sm text-muted">
            {inStock
              ? product.stock > 4
                ? `${product.stock} ready to send.`
                : `Only ${product.stock} left.`
              : "Available to order."}
          </p>

          <p className="mt-6 text-xs uppercase tracking-widest">Size</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {product.sizes.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setSize(option);
                  setError("");
                }}
                className={`min-h-11 min-w-14 border px-3 text-sm ${
                  size === option ? "border-ink bg-ink text-bone" : "border-line bg-paper"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}

          <div className="mt-5 flex items-center gap-3">
            <label className="text-xs uppercase tracking-widest" htmlFor="qty">
              Qty
            </label>
            <select
              id="qty"
              className="field w-24"
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
            >
              {Array.from({ length: maxQty }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <button type="button" className="btn btn-primary mt-6 w-full sm:w-auto" onClick={addToBag}>
            Add to bag
          </button>
          <p className="mt-3 text-sm text-muted">Choose a size, then add it. Your bag opens so you can check out or keep shopping.</p>
          {product.printable ? (
            <div className="mt-4">
              <NoReturnNotice />
              <p className="mt-3 text-sm text-muted">Name, number and badges are chosen at checkout. Up to 12 letters and 2 numbers.</p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">This piece is not printed.</p>
          )}

          <section className="mt-8">
            <SizeChartTable id={product.sizeChart} />
            <div className="mt-3">
              <SizeNote />
            </div>
            <Link to="/size-guide" className="mt-3 inline-block text-sm underline">
              Full size guide
            </Link>
          </section>

          <dl className="mt-8 space-y-4 border-t border-line pt-6 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-widest text-muted">Cloth</dt>
              <dd className="mt-1">
                Authentic replicas. Match-weight polyester in the team colours.
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-widest text-muted">Delivery</dt>
              <dd className="mt-1">
                Sent from Bloemfontein. Courier Guy or Aramex is {formatMoney(COURIER_FEE)} anywhere except Bloemfontein. Delivery is free only in Bloemfontein. Collect free at {COLLECTION_ADDRESS}. {COLLECTION_HOURS} A different courier is charged to you and confirmed on WhatsApp.
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-widest text-muted">Order</dt>
              <dd className="mt-1">Checkout sends the order on WhatsApp. We confirm stock and payment there.</dd>
            </div>
          </dl>
        </div>
      </div>

      {related.length > 0 ? (
        <section className="mt-14">
          <h2 className="text-3xl uppercase">More {categoryLabel(product.category)}</h2>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.slug} product={item} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
