import { createFileRoute, Link } from "@tanstack/react-router";
import { RED_BULL_JACKET, TO_ORDER_NOTE, formatMoney, shopQuery, stockedCategories } from "@/data/catalog";
import { CategoryArt } from "@/components/category-art";
import { JacketReel } from "@/components/jacket-reel";
import { ProductCard } from "@/components/product-card";
import { dailyShelfPhoto, ShelfShow } from "@/components/shelf-show";
import { useCatalog } from "@/lib/catalog-context";
import { WHATSAPP_NUMBER } from "@/lib/whatsapp-order";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const { products } = useCatalog();
  const jacket = products.find((product) => product.slug === RED_BULL_JACKET);
  const onHand = products.filter((product) => product.availability === "on_hand" && product.slug !== RED_BULL_JACKET);
  const toOrder = products.filter((product) => product.availability === "to_order" && product.slug !== RED_BULL_JACKET);
  const shelves = stockedCategories(products);

  function shelfImages(categoryId: string) {
    const photo = dailyShelfPhoto(products, categoryId);
    return photo ? [photo] : [];
  }

  return (
    <main>
      <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 lg:grid-cols-12 lg:py-14">
        <div className="lg:col-span-5">
          <p className="text-sm text-brass">Welcome to Jordaan Infinite Sports.</p>
          <h1 className="mt-3 font-display text-6xl uppercase leading-none sm:text-7xl">Shop quality</h1>
          <p className="mt-5 max-w-md text-muted">
            Authentic replicas. Custom shirts. International teams — on hand or made for you.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link to="/shop" search={shopQuery()} className="btn btn-primary">
              Shop now
            </Link>
            <p className="text-sm text-muted">Quality guaranteed</p>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noreferrer"
              aria-label="Chat on WhatsApp"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#25D366] text-white"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6">
                <path
                  fill="currentColor"
                  d="M20.5 3.5A11 11 0 0 0 2.1 17.8L1 23l5.3-1.1A11 11 0 0 0 20.5 3.5zM12 20.3a8.3 8.3 0 0 1-4.2-1.1l-.3-.2-3.1.8.8-3-.2-.3A8.3 8.3 0 1 1 12 20.3zm4.6-6.2c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.5.1-.6.8-.7.9-.3.2-.5.1a6.8 6.8 0 0 1-2-1.2 7.4 7.4 0 0 1-1.4-1.7c-.1-.3 0-.4.1-.5l.4-.4.2-.3a.5.5 0 0 0 0-.4c0-.1-.5-1.3-.7-1.7s-.4-.4-.5-.4h-.5a1 1 0 0 0-.7.3 2.9 2.9 0 0 0-.9 2.2 5 5 0 0 0 1.1 2.7 11.6 11.6 0 0 0 4.4 3.9 15 15 0 0 0 1.5.5 3.6 3.6 0 0 0 1.6.1 2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.2-.2-.4-.3z"
                />
              </svg>
            </a>
          </div>
        </div>
        <div className="lg:col-span-7">
          <ShelfShow products={products} />
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl grid-cols-3 gap-2 px-4 pb-2">
        <Link to="/news" className="bg-paper px-3 py-2.5">
          <p className="text-[11px] text-brass">Open to everyone</p>
          <h2 className="mt-0.5 text-sm">Daily news</h2>
          <p className="mt-1 text-xs leading-snug text-muted">Headlines and results, refreshed through the day.</p>
        </Link>
        <Link to="/tips" className="bg-paper px-3 py-2.5">
          <p className="text-[11px] text-brass">Registered · 18+</p>
          <h2 className="mt-0.5 text-sm">Daily tips</h2>
          <p className="mt-1 text-xs leading-snug text-muted">Today’s football, rugby and NFL. Results when full time.</p>
        </Link>
        <Link to="/score" className="bg-paper px-3 py-2.5">
          <p className="text-[11px] text-brass">R100 · 18+</p>
          <h2 className="mt-0.5 text-sm">Correct score</h2>
          <p className="mt-1 text-xs leading-snug text-muted">First week and last week of every month.</p>
        </Link>
      </section>

      <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-8 lg:grid-cols-2">
        <JacketReel />
        <div>
          <p className="text-sm text-brass">Formula 1</p>
          <h2 className="mt-2 font-display text-4xl">Red Bull Racing jacket</h2>
          <p className="mt-3 max-w-md text-sm text-muted">
            Navy softshell. The photos turn through the front, the back, the side, the sleeve and the neck label.
          </p>
          <p className="mt-4 font-display text-3xl tabular-nums">{formatMoney(jacket?.price ?? 0)}</p>
          <Link to="/product/$slug" params={{ slug: RED_BULL_JACKET }} className="btn btn-line mt-5">
            View jacket
          </Link>
        </div>
      </section>

      <Rail
        title="On hand"
        lede="Ready to send."
        products={onHand.slice(0, 8)}
        href={shopQuery("all", "on_hand")}
        more="All on hand"
      />
      <Rail
        title="Available to order"
        lede={TO_ORDER_NOTE}
        products={toOrder.slice(0, 8)}
        href={shopQuery("all", "to_order")}
        more="All to order"
      />

      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="font-display text-4xl">Browse the shelves</h2>
        <p className="mt-3 max-w-xl text-sm text-muted">
          Empty shelves stay hidden. Local is Lekker is South African clubs and national teams. League Kits 26/27 is the current football season.
        </p>
        <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {shelves.map((category) => {
            const count = products.filter((product) => product.category === category.id).length;
            return (
              <Link
                key={category.id}
                to="/shop"
                search={shopQuery(category.id)}
                className="flex flex-col overflow-hidden bg-paper"
              >
                <span className="block h-20 w-full overflow-hidden bg-[#0e0e0e] sm:h-24">
                  <CategoryArt images={shelfImages(category.id)} label={category.label} />
                </span>
                <span className="px-2 py-2">
                  <span className="block text-sm leading-tight">{category.label}</span>
                  <span className="mt-1 block text-xs text-muted">
                    {count === 0 ? "None listed yet" : `${count} ${count === 1 ? "kit" : "kits"}`}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mx-auto mt-4 grid max-w-6xl gap-px bg-line px-4 sm:grid-cols-3">
        {[
          ["Collect in Brandwag", "6 Nobel Street, Brandwag, Bloemfontein. Weekdays after 17:30. Weekends from 07:00 to 20:00. Collection is free."],
          ["Courier Guy or Aramex", "R110 outside Bloemfontein, sent from here. Free delivery only if the city is Bloemfontein. A different courier is charged to you and confirmed on WhatsApp."],
          ["No returns on printing", "A name, number or badge cannot be refunded or returned. A 2–4 cm fit difference is normal. Teams can send a bulk list."],
        ].map(([title, body]) => (
          <div key={title} className="bg-bone py-8 sm:px-6 sm:first:pl-0 sm:last:pr-0">
            <h3 className="font-display text-2xl">{title}</h3>
            <p className="mt-2 text-sm text-muted">{body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}

function Rail({
  title,
  lede,
  products,
  href,
  more,
  empty,
}: {
  title: string;
  lede: string;
  products: ReturnType<typeof useCatalog>["products"];
  href: ReturnType<typeof shopQuery>;
  more: string;
  empty?: string;
}) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-4xl">{title}</h2>
          <p className="mt-2 text-sm text-muted">{lede}</p>
        </div>
        <Link to="/shop" search={href} className="shrink-0 text-sm underline">
          {more}
        </Link>
      </div>
      {products.length === 0 ? (
        empty ? <p className="max-w-xl border border-line bg-paper px-5 py-8 text-sm text-muted">{empty}</p> : null
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
