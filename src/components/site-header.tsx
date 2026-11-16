import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, Moon, Search, ShoppingBag, Sun, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { shopQuery } from "@/data/catalog";
import { ScoreTicker } from "@/components/score-ticker";
import { cartCount, useShop } from "@/lib/store";
import { useHydrated } from "@/lib/use-hydrated";

export function SiteHeader() {
  const navigate = useNavigate();
  const hydrated = useHydrated();
  const lines = useShop((s) => s.lines);
  const setOpen = useShop((s) => s.setOpen);
  const [menu, setMenu] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const count = hydrated ? cartCount(lines) : 0;

  function goSearch(event: FormEvent) {
    event.preventDefault();
    setMenu(false);
    setSearchOpen(false);
    void navigate({
      to: "/shop",
      search: shopQuery("all", "all", query.trim()),
    });
  }

  function close() {
    setMenu(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bone">
      <ScoreTicker />
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center lg:hidden"
          aria-label={menu ? "Close menu" : "Open menu"}
          onClick={() => setMenu((v) => !v)}
        >
          {menu ? <X /> : <Menu />}
        </button>
        <Link to="/" className="flex items-center gap-2" aria-label="Jordaan Infinite Sportswear">
          <img src="/brand/logo.png" alt="" className="logo-on-light h-12 w-auto" />
          <img src="/brand/mark-dark.png" alt="" className="logo-on-dark h-12 w-auto" />
          <span className="font-display text-2xl uppercase leading-none tracking-wide sm:text-3xl">J.I.S</span>
        </Link>
        <nav className="ml-8 hidden min-w-0 flex-1 flex-wrap items-center justify-between gap-x-6 gap-y-2 lg:flex">
          <Link to="/shop" search={shopQuery()} className="text-sm">
            Shop
          </Link>
          <Link to="/shop" search={shopQuery("all", "on_hand")} className="text-sm">
            On hand
          </Link>
          <Link to="/shop" search={shopQuery("all", "to_order")} className="text-sm">
            To order
          </Link>
          <Link to="/shop" search={shopQuery("new")} className="text-sm">
            New
          </Link>
          <Link to="/news" className="text-sm">
            News
          </Link>
          <Link to="/tips" className="text-sm">
            Tips
          </Link>
          <Link to="/score" className="text-sm">
            Score
          </Link>
          <Link to="/size-guide" className="text-sm">
            Sizes
          </Link>
          <Link to="/track" search={{ id: "" }} className="text-sm">
            Track
          </Link>
          <Link to="/bulk" className="text-sm">
            Bulk
          </Link>
          <Link to="/admin" className="text-sm text-muted">
            Admin
          </Link>
        </nav>
        <div className="ml-auto flex items-center">
          <button
            type="button"
            className="inline-flex h-11 items-center gap-1.5 px-2 text-sm"
            aria-label="Switch between light and dark"
            onClick={() => {
              const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
              document.documentElement.dataset.theme = next;
              localStorage.setItem("jis-theme", next);
            }}
          >
            <Sun size={18} className="hidden dark:block" />
            <Moon size={18} className="dark:hidden" />
            <span className="hidden sm:inline dark:hidden">Dark</span>
            <span className="hidden sm:dark:inline">Light</span>
          </button>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center"
            aria-label="Search kits"
            onClick={() => setSearchOpen((v) => !v)}
          >
            <Search size={20} />
          </button>
          <button
            type="button"
            className="relative inline-flex h-11 w-11 items-center justify-center"
            aria-label={`Open bag, ${count} ${count === 1 ? "item" : "items"}`}
            onClick={() => setOpen(true)}
          >
            <ShoppingBag size={20} />
            {count > 0 ? (
              <span className="absolute right-1 top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-pitch px-1 text-xs text-on-pitch tabular-nums">
                {count}
              </span>
            ) : null}
          </button>
        </div>
      </div>
      {searchOpen ? (
        <form onSubmit={goSearch} className="border-t border-line px-4 py-3">
          <div className="mx-auto flex max-w-6xl gap-2">
            <input
              className="field"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search kits, teams, WhatsApp or the address"
              aria-label="Search"
              autoFocus
            />
            <button className="btn btn-ink" type="submit">
              Search
            </button>
          </div>
        </form>
      ) : null}
      {menu ? (
        <nav className="flex flex-col border-t border-line px-4 py-3 lg:hidden">
          <Link to="/shop" search={shopQuery()} className="py-3 text-lg" onClick={close}>
            All kits
          </Link>
          <Link to="/shop" search={shopQuery("all", "on_hand")} className="py-3 text-lg" onClick={close}>
            On hand
          </Link>
          <Link to="/shop" search={shopQuery("all", "to_order")} className="py-3 text-lg" onClick={close}>
            Available to order
          </Link>
          <Link to="/shop" search={shopQuery("new")} className="py-3 text-lg" onClick={close}>
            New arrivals
          </Link>
          <Link to="/news" className="py-3 text-lg" onClick={close}>
            Daily news
          </Link>
          <Link to="/tips" className="py-3 text-lg" onClick={close}>
            Weekend tips
          </Link>
          <Link to="/score" className="py-3 text-lg" onClick={close}>
            Correct score
          </Link>
          <Link to="/size-guide" className="py-3 text-lg" onClick={close}>
            Size guide
          </Link>
          <Link to="/track" search={{ id: "" }} className="py-3 text-lg" onClick={close}>
            Track an order
          </Link>
          <Link to="/bulk" className="py-3 text-lg" onClick={close}>
            Bulk orders
          </Link>
          <Link to="/orders" className="py-3 text-lg" onClick={close}>
            Your orders
          </Link>
          <Link to="/admin" className="py-3 text-lg" onClick={close}>
            Admin
          </Link>
        </nav>
      ) : null}
    </header>
  );
}
