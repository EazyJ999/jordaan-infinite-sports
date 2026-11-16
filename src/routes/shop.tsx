import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AVAILABILITY, CATEGORIES, TO_ORDER_NOTE, categoryLabel, filterProducts, isShopSort, shopQuery, type ShopQuery } from "@/data/catalog";
import { contactHits } from "@/data/site-search";
import { ProductCard } from "@/components/product-card";
import { CategoryArt } from "@/components/category-art";
import { dailyShelfPhoto } from "@/components/shelf-show";
import { SizeChartTable, SizeNote } from "@/components/size-chart";
import { useCatalog } from "@/lib/catalog-context";
import { chartForCategory } from "@/data/size-charts";

export const Route = createFileRoute("/shop")({
  validateSearch: (search: Record<string, unknown>): ShopQuery => ({
    category: typeof search.category === "string" ? search.category : "all",
    availability: typeof search.availability === "string" ? search.availability : "all",
    q: typeof search.q === "string" ? search.q : "",
    sort: isShopSort(search.sort) ? search.sort : "name",
    team: typeof search.team === "string" && search.team ? search.team : "all",
  }),
  head: () => ({
    meta: [{ title: "Shop · J.I.S" }],
  }),
  component: ShopPage,
});

function ShopPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/shop" });
  const { products } = useCatalog();
  const [draft, setDraft] = useState(search.q);
  const list = filterProducts(products, search);
  const category = CATEGORIES.find((item) => item.id === search.category);
  const availability = AVAILABILITY.find((item) => item.id === search.availability);
  const title = category?.label ?? availability?.label ?? "All kits";

  const teams = [...new Set(products.filter((product) => search.category === "all" || product.category === search.category).map((product) => product.team))].sort((a, b) => a.localeCompare(b));
  const hits = contactHits(search.q);

  function setFilter(patch: Partial<ShopQuery>) {
    void navigate({ search: { ...search, ...patch } });
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <p className="text-xs uppercase tracking-widest text-brass">Shop</p>
      <h1 className="mt-2 text-5xl uppercase">{title}</h1>
      {category ? (
        <div className="mt-4 h-40 w-full max-w-sm overflow-hidden border border-line bg-[#0e0e0e] sm:h-48">
          <CategoryArt
            images={[dailyShelfPhoto(products, category.id) ?? ""]}
            label={category.label}
          />
        </div>
      ) : null}
      <p className="mt-3 max-w-xl text-sm text-muted">
        {availability
          ? availability.id === "to_order"
            ? TO_ORDER_NOTE
            : availability.hint
          : category?.id === "leagues"
            ? "Football leagues. Premier League, LaLiga, Serie A, Bundesliga, Ligue 1 and the rest."
            : category?.id === "polos"
              ? "Football polo shirts."
            : category?.id === "local"
              ? "South African clubs and national teams, home and away."
              : category?.id === "international"
                ? "National teams from around the world. South African sides stay on Local is Lekker."
                : category
                ? `Filed under ${category.label}. Prices are in Rand.`
                : "Every item on the site. Filter by shelf, or by what is on hand versus what you can order in."}
      </p>

      <form
        className="mt-6 flex flex-wrap gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          setFilter({ q: draft.trim() });
        }}
      >
        <input
          className="field min-w-0 flex-1"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Search a kit, a team, WhatsApp or the address"
          aria-label="Search the shop"
        />
        <button className="btn btn-ink" type="submit">
          Search
        </button>
      </form>

      <div className="mt-4 flex flex-wrap gap-3">
        <Chip active={search.availability === "all"} onClick={() => setFilter({ availability: "all" })}>
          All stock
        </Chip>
        {AVAILABILITY.map((item) => (
          <Chip
            key={item.id}
            active={search.availability === item.id}
            onClick={() => setFilter({ availability: item.id })}
          >
            {item.label}
          </Chip>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <Chip active={search.category === "all"} onClick={() => setFilter({ category: "all" })}>
          All
        </Chip>
        {CATEGORIES.map((item) => (
          <Chip key={item.id} active={search.category === item.id} onClick={() => setFilter({ category: item.id })}>
            {item.label}
          </Chip>
        ))}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          Team
          <select className="field mt-1" value={search.team} onChange={(event) => setFilter({ team: event.target.value })}>
            <option value="all">All teams</option>
            {teams.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Sort
          <select
            className="field mt-1"
            value={search.sort}
            onChange={(event) => setFilter({ sort: isShopSort(event.target.value) ? event.target.value : "name" })}
          >
            <option value="name">Name</option>
            <option value="team">Team</option>
            <option value="price-asc">Price, low to high</option>
            <option value="price-desc">Price, high to low</option>
          </select>
        </label>
      </div>

      {hits.length > 0 ? (
        <ul className="mt-4 grid gap-2">
          {hits.map((hit) => (
            <li key={hit.title} className="border border-line bg-paper px-4 py-3 text-sm">
              <p className="text-xs uppercase tracking-widest text-brass">{hit.title}</p>
              <p className="mt-1">{hit.text}</p>
              {"href" in hit ? (
                <a href={hit.href} className="mt-1 inline-block underline" target="_blank" rel="noreferrer">
                  Open
                </a>
              ) : (
                <Link to={hit.to} className="mt-1 inline-block underline">
                  Open
                </Link>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      <p className="mt-6 text-sm text-muted">
        {list.length} {list.length === 1 ? "kit" : "kits"}
        {search.q ? ` for “${search.q}”` : ""}
      </p>

      {list.length === 0 ? (
        <div className="mt-8 border border-line bg-paper px-5 py-10">
          <h2 className="text-3xl uppercase">Nothing here yet</h2>
          <p className="mt-2 max-w-md text-sm text-muted">
            {search.availability === "on_hand"
              ? "Nothing is on hand right now. This shelf stays up for kits that are ready to send."
              : category
                ? `${categoryLabel(category.id)} is set up. Add a picture from Admin and it will show on this shelf.`
                : "Try another league, or clear the filters."}
          </p>
          <button type="button" className="btn btn-ink mt-5" onClick={() => void navigate({ search: shopQuery() })}>
            Show all kits
          </button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
          {list.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      )}
      {category ? (
        <div className="mt-12">
          <SizeChartTable id={chartForCategory(category.id)} />
          <div className="mt-4">
            <SizeNote />
          </div>
        </div>
      ) : null}
    </main>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-11 border px-3 text-sm ${
        active ? "border-ink bg-ink text-bone" : "border-line bg-paper text-ink"
      }`}
    >
      {children}
    </button>
  );
}
