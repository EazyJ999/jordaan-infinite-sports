import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { RedirectToSignIn, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { AVAILABILITY, CATEGORIES, SEASON_YEARS, availabilityLabel, categoryLabel, formatMoney, listPrice, seasonCode, seasonText, type Availability, type Category } from "@/data/catalog";
import { SIZE_CHARTS, chartAllowsPrint, chartForCategory, sizesFor, type SizeChartId } from "@/data/size-charts";
import { pingCatalog } from "@/lib/catalog-context";
import { claimDesk, loadDesk, removeProduct, saveProduct, type AdminProduct } from "@/lib/catalog.functions";
import { DeskOps } from "@/components/desk-ops";
import { PayPalAdmin } from "@/components/paypal-checkout";
import { PhotoDrop } from "@/components/photo-drop";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin · J.I.S" }] }),
  component: AdminPage,
});

type Draft = {
  slug: string;
  name: string;
  team: string;
  category: Category;
  availability: Availability;
  price: string;
  fanPrice: string;
  boxPrice: string;
  boxFanPrice: string;
  blurb: string;
  stock: string;
  image: string;
  gallery: string[];
  hidden: boolean;
  sizeChart: SizeChartId;
  printable: boolean;
  season: string;
};

const blank = (): Draft => ({
  slug: "",
  name: "",
  team: "",
  category: "new",
  availability: "on_hand",
  price: "",
  fanPrice: "1299",
  boxPrice: "699",
  boxFanPrice: "599",
  blurb: "",
  stock: "10",
  image: "",
  gallery: [],
  hidden: false,
  sizeChart: "player",
  printable: true,
  season: "",
});

function fromProduct(product: AdminProduct): Draft {
  return {
    slug: product.slug,
    name: product.name,
    team: product.team,
    category: product.category,
    availability: product.availability,
    price: String(product.price),
    fanPrice: String(product.fanPrice),
    boxPrice: product.boxPrice == null ? "" : String(product.boxPrice),
    boxFanPrice: product.boxFanPrice == null ? "" : String(product.boxFanPrice),
    blurb: product.blurb,
    stock: String(product.stock),
    image: product.image,
    gallery: product.gallery ?? [],
    hidden: product.hidden,
    sizeChart: product.sizeChart,
    printable: product.printable,
    season: product.season,
  };
}

function AdminPage() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16">
        <p className="text-sm uppercase tracking-widest text-muted">Opening admin…</p>
      </main>
    );
  }
  if (!user) return <RedirectToSignIn to="/login" />;
  return <Desk name={user.displayName || user.primaryEmail || "Owner"} />;
}

function Desk({ name }: { name: string }) {
  const [state, setState] = useState<"loading" | "unclaimed" | "taken" | "owner" | "error">("loading");
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [draft, setDraft] = useState<Draft>(blank());
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [tab, setTab] = useState<"kits" | "orders" | "stock" | "bulk">("kits");

  async function refresh() {
    const desk = await loadDesk();
    setState(desk.state);
    setProducts(desk.products);
    return desk;
  }

  useEffect(() => {
    let stop = false;
    loadDesk()
      .then((desk) => {
        if (stop) return;
        setState(desk.state);
        setProducts(desk.products);
        const first = desk.products[0];
        if (first) setDraft(fromProduct(first));
      })
      .catch(() => {
        if (!stop) setState("error");
      });
    return () => {
      stop = true;
    };
  }, []);

  async function claim() {
    setBusy(true);
    setError("");
    try {
      const result = await claimDesk();
      if (result.state !== "owner") {
        setState("taken");
        return;
      }
      const desk = await refresh();
      const first = desk.products[0];
      if (first) setDraft(fromProduct(first));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open admin.");
    } finally {
      setBusy(false);
    }
  }

  function select(product: AdminProduct) {
    setDraft(fromProduct(product));
    setMessage("");
    setError("");
    setConfirmRemove(false);
  }

  async function onFile(files: FileList | undefined) {
    const list = files ? [...files] : [];
    if (list.length === 0) return;
    setError("");
    try {
      const photos: string[] = [];
      for (const file of list.slice(0, 6)) photos.push(await shrinkPhoto(file));
      setDraft((current) => ({
        ...current,
        image: photos[0] ?? current.image,
        gallery: list.length > 1 ? photos.slice(1) : current.gallery,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that picture.");
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await saveProduct({
        data: {
          slug: draft.slug,
          name: draft.name,
          team: draft.team,
          category: draft.category,
          availability: draft.availability,
          price: Number(draft.price),
          fanPrice: Number(draft.price),
          boxPrice: null,
          boxFanPrice: null,
          blurb: draft.blurb,
          stock: Number(draft.stock),
          image: draft.image,
          gallery: draft.gallery,
          hidden: draft.hidden,
          sizeChart: draft.sizeChart,
          printable: draft.printable,
          season: draft.season,
        },
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      pingCatalog();
      const desk = await refresh();
      const saved = desk.products.find((item) => item.slug === result.product.slug) ?? result.product;
      setDraft(fromProduct(saved));
      setMessage("Saved. The shop is already showing this.");
      setConfirmRemove(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that kit.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!draft.slug) return;
    if (!confirmRemove) {
      setConfirmRemove(true);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await removeProduct({ data: draft.slug });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      pingCatalog();
      const desk = await refresh();
      const first = desk.products[0];
      setDraft(first ? fromProduct(first) : blank());
      setMessage("Removed from the shop.");
      setConfirmRemove(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove that kit.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-brass">Admin</p>
          <h1 className="mt-2 text-5xl uppercase leading-none">J.I.S desk</h1>
          <p className="mt-2 text-sm text-muted">Signed in as {name}. Pictures, prices, stock and order status update the shop.</p>
        </div>
        <UserButton />
      </div>

      {state === "loading" ? <p className="mt-10 text-sm text-muted">Loading kits…</p> : null}
      {state === "error" ? (
        <p className="mt-10 text-sm text-danger">Admin could not open. Refresh the page, or sign in again.</p>
      ) : null}
      {state === "taken" ? (
        <div className="mt-10 max-w-lg border border-line bg-paper px-5 py-6">
          <h2 className="text-3xl uppercase">This shop already has an owner</h2>
          <p className="mt-2 text-sm text-muted">Sign in with the account that claimed admin. A second login cannot change prices or pictures.</p>
        </div>
      ) : null}
      {state === "unclaimed" ? (
        <div className="mt-10 max-w-lg border border-line bg-paper px-5 py-6">
          <h2 className="text-3xl uppercase">Make this your shop</h2>
          <p className="mt-2 text-sm text-muted">
            The first account to claim it is the only one that can change pictures, descriptions and prices. Use the login you want to keep.
          </p>
          {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
          <button type="button" className="btn btn-primary mt-5" onClick={() => void claim()} disabled={busy}>
            This is my shop
          </button>
        </div>
      ) : null}

      {state === "owner" ? (
        <>
          <PayPalAdmin />
          <div className="mt-8 flex flex-wrap gap-2">
            {(
              [
                ["kits", "Kits"],
                ["stock", "Stock"],
                ["orders", "Orders"],
                ["bulk", "Bulk"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`btn ${tab === id ? "btn-primary" : "btn-line"}`}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </div>
          {tab === "kits" ? (
        <div className="mt-8 grid items-start gap-8">
          <PhotoDrop
            shrink={shrinkPhoto}
            onSaved={() => {
              pingCatalog();
              void refresh();
            }}
          />
        <div className="grid items-start gap-8 lg:grid-cols-[280px_1fr]">
          <div>
            <button
              type="button"
              className="btn btn-ink w-full"
              onClick={() => {
                setDraft(blank());
                setMessage("");
                setError("");
                setConfirmRemove(false);
              }}
            >
              Add a kit
            </button>
            <ul className="mt-4 max-h-[70vh] overflow-y-auto border border-line">
              {products.map((product) => (
                <li key={product.slug}>
                  <button
                    type="button"
                    onClick={() => select(product)}
                    className={`flex w-full items-center gap-3 border-b border-line px-3 py-2 text-left ${
                      draft.slug === product.slug ? "bg-paper" : "bg-bone"
                    }`}
                  >
                    <img src={product.image} alt="" className="h-14 w-11 object-contain bg-[#0e0e0e]" />
                    <span className="min-w-0">
                      <span className="block truncate font-display text-lg uppercase leading-none">{product.name}</span>
                      <span className="text-xs text-muted">
                        {categoryLabel(product.category)}
                        {product.season ? ` · ${product.season}` : ""} ·{" "}
                        {formatMoney(product.price)}
                        {product.availability === "to_order" ? " · To order" : ""}
                        {product.hidden ? " · Hidden" : ""}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <form onSubmit={(event) => void save(event)} className="border border-line bg-paper px-4 py-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="text-3xl uppercase">{draft.slug ? "Edit kit" : "New kit"}</h2>
              {draft.slug ? (
                <Link to="/product/$slug" params={{ slug: draft.slug }} className="text-sm underline">
                  View on the shop
                </Link>
              ) : null}
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-[160px_1fr]">
              <div>
                {draft.image ? (
                  <img src={draft.image} alt="" className="aspect-[3/4] w-full object-contain bg-[#0e0e0e]" />
                ) : (
                  <div className="grid aspect-[3/4] place-items-center bg-bone text-xs uppercase tracking-widest text-muted">No photo</div>
                )}
                <label className="btn btn-line mt-3 w-full">
                  {draft.image ? "Replace pictures" : "Add pictures"}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={(event) => {
                      void onFile(event.target.files ?? undefined);
                      event.target.value = "";
                    }}
                  />
                </label>
                {draft.gallery.length > 0 ? (
                  <p className="mt-2 text-xs text-muted">{draft.gallery.length + 1} photos on this kit.</p>
                ) : null}
                <label className="mt-3 block text-sm">
                  Shirt year
                  <select
                    className="field mt-1"
                    value={draft.season}
                    onChange={(e) => setDraft({ ...draft, season: e.target.value })}
                  >
                    <option value="">No year</option>
                    {[...SEASON_YEARS].reverse().map((year) => {
                      const code = seasonCode(year);
                      return (
                        <option key={year} value={code}>
                          {seasonText(code)}
                        </option>
                      );
                    })}
                  </select>
                </label>
              </div>
              <div className="flex flex-col gap-3">
                <label className="text-sm">
                  Name
                  <input className="field mt-1" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required />
                </label>
                <label className="text-sm">
                  Team
                  <input className="field mt-1" value={draft.team} onChange={(e) => setDraft({ ...draft, team: e.target.value })} required />
                </label>
                <label className="text-sm">
                  Category
                  <select
                    className="field mt-1"
                    value={draft.category}
                    onChange={(e) => {
                      const category = e.target.value as Category;
                      const sizeChart = chartForCategory(category);
                      const nextPrice = listPrice(category);
                      const prevPrice = listPrice(draft.category);
                      const prevText = prevPrice == null ? "" : String(prevPrice);
                      const nextText = nextPrice == null ? "" : String(nextPrice);
                      setDraft({
                        ...draft,
                        category,
                        ...(draft.slug
                          ? {}
                          : {
                              sizeChart,
                              printable: chartAllowsPrint(sizeChart),
                              price: draft.price === "" || draft.price === prevText ? nextText : draft.price,
                            }),
                      });
                    }}
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  Stock status
                  <select
                    className="field mt-1"
                    value={draft.availability}
                    onChange={(e) => setDraft({ ...draft, availability: e.target.value as Availability })}
                  >
                    {AVAILABILITY.map((item) => (
                      <option key={item.id} value={item.id}>
                        {availabilityLabel(item.id)} — {item.hint}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  Price (R)
                  <input
                    className="field mt-1"
                    inputMode="numeric"
                    value={draft.price}
                    onChange={(e) => setDraft({ ...draft, price: e.target.value.replace(/[^\d]/g, "") })}
                    required
                  />
                  {draft.category === "tracksuits" ? (
                    <span className="mt-1 block text-xs text-muted">
                      Half-zip adult R980. Full-zip adult R1 200. Kids half-zip R900. Kids full-zip R980.
                    </span>
                  ) : null}
                  {draft.category === "boots" || draft.category === "babies" ? (
                    <span className="mt-1 block text-xs text-muted">Not on the price list yet. Type the rand amount you want to charge.</span>
                  ) : null}
                </label>
                <label className="text-sm">
                  On-hand stock
                  <input
                    className="field mt-1"
                    inputMode="numeric"
                    value={draft.stock}
                    onChange={(e) => setDraft({ ...draft, stock: e.target.value.replace(/[^\d]/g, "") })}
                    required
                  />
                </label>
                <label className="text-sm">
                  Size chart
                  <select
                    className="field mt-1"
                    value={draft.sizeChart}
                    onChange={(e) => {
                      const sizeChart = e.target.value as SizeChartId;
                      setDraft({ ...draft, sizeChart, printable: chartAllowsPrint(sizeChart) });
                    }}
                  >
                    {SIZE_CHARTS.map((chart) => (
                      <option key={chart.id} value={chart.id}>
                        {chart.title}
                      </option>
                    ))}
                  </select>
                  <span className="mt-1 block text-xs text-muted">Sizes: {sizesFor(draft.sizeChart).join(", ")}</span>
                </label>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={draft.printable}
                    onChange={(e) => setDraft({ ...draft, printable: e.target.checked })}
                  />
                  <span>
                    Shirt or long sleeve — allow name and number printing
                    <span className="mt-1 block text-xs text-muted">
                      Jackets and coats stay plain unless you tick this. Printed items cannot be returned.
                    </span>
                  </span>
                </label>
                <label className="text-sm">
                  Description
                  <textarea
                    className="field mt-1 min-h-28 py-3"
                    value={draft.blurb}
                    onChange={(e) => setDraft({ ...draft, blurb: e.target.value })}
                  />
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.hidden}
                    onChange={(e) => setDraft({ ...draft, hidden: e.target.checked })}
                  />
                  Hide from the shop
                </label>
              </div>
            </div>
            {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
            {message ? <p className="mt-4 text-sm text-brass">{message}</p> : null}
            <div className="mt-5 flex flex-wrap gap-3">
              <button className="btn btn-primary" type="submit" disabled={busy}>
                {busy ? "Saving…" : "Save to the shop"}
              </button>
              {draft.slug ? (
                <button type="button" className="btn btn-line" onClick={() => void remove()} disabled={busy}>
                  {confirmRemove ? "Confirm remove" : "Remove"}
                </button>
              ) : null}
            </div>
          </form>
        </div>
        </div>
          ) : (
            <DeskOps
              tab={tab}
              products={products}
              onChanged={() => {
                pingCatalog();
                void refresh();
              }}
            />
          )}
        </>
      ) : null}
    </main>
  );
}

async function shrinkPhoto(file: File) {
  const [bitmap, logo] = await Promise.all([createImageBitmap(file), loadLogo()]);
  const max = 1100;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not read that picture.");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const short = Math.min(canvas.width, canvas.height);
  const ratio = logo.naturalWidth ? logo.naturalHeight / logo.naturalWidth : 1;
  const markW = Math.max(84, Math.round(short * 0.2));
  const markH = Math.round(markW * ratio);
  const margin = 8;
  ctx.drawImage(logo, canvas.width - markW - margin, canvas.height - markH - margin, markW, markH);
  let quality = 0.82;
  let url = canvas.toDataURL("image/jpeg", quality);
  while (url.length > 900_000 && quality > 0.45) {
    quality -= 0.08;
    url = canvas.toDataURL("image/jpeg", quality);
  }
  if (url.length > 1_200_000) throw new Error("That picture is still too large. Try a smaller one.");
  return url;
}

function loadLogo() {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load the logo."));
    img.src = "/brand/mark.png";
  });
}
