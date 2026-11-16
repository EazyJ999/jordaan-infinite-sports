import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { products as seedProducts, coarseSport, isCategory, normalizeSeason, type Availability, type Category, type Product } from "@/data/catalog";
import { chartAllowsPrint, chartForCategory, isSizeChart, sizesFor, type SizeChartId } from "@/data/size-charts";

export type AdminProduct = Product & { hidden: boolean };

type Row = {
  slug: string;
  name: string;
  team: string;
  sport: string;
  category: string;
  availability: string;
  region: string;
  kind: string;
  price: number;
  fan_price: number;
  box_price: number | null;
  box_fan_price: number | null;
  image: string;
  blurb: string;
  stock: number;
  sizes: string;
  size_chart: string;
  printable: boolean;
  hidden: boolean;
  season: string;
  gallery: string;
};

function asCategory(value: string): Category {
  return isCategory(value) ? value : "leagues";
}

function asAvailability(value: string): Availability {
  return value === "to_order" ? "to_order" : "on_hand";
}

function toProduct(row: Row): Product {
  return {
    slug: row.slug,
    name: row.name,
    team: row.team,
    category: asCategory(row.category),
    availability: asAvailability(row.availability),
    region: "international",
    kind: "jersey",
    price: Number(row.price),
    fanPrice: Number(row.fan_price ?? row.price),
    boxPrice: row.box_price == null ? null : Number(row.box_price),
    boxFanPrice: row.box_fan_price == null ? null : Number(row.box_fan_price),
    image: row.image,
    gallery: parseGallery(row.gallery, row.image),
    blurb: row.blurb,
    stock: Number(row.stock),
    sizes: row.sizes.split(",").map((size) => size.trim()).filter(Boolean),
    sizeChart: isSizeChart(row.size_chart) ? row.size_chart : chartForCategory(row.category),
    printable: row.printable == null ? chartAllowsPrint(row.size_chart ?? "") : Boolean(row.printable),
    season: normalizeSeason(row.season ?? "") ?? "",
  };
}

function toAdmin(row: Row): AdminProduct {
  return { ...toProduct(row), hidden: Boolean(row.hidden) };
}

async function ready() {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  await sql`alter table products add column if not exists gallery text not null default '[]'`;
  await sql`
    update products
    set
      name = replace(regexp_replace(name, '[Rr][Ee][Dd][Bb]ull', 'Red Bull', 'g'), 'JAcket', 'jacket'),
      team = regexp_replace(team, '[Rr][Ee][Dd][Bb]ull', 'Red Bull', 'g'),
      blurb = regexp_replace(blurb, '[Rr][Ee][Dd][Bb]ull', 'Red Bull', 'g')
    where name ~* 'redbull' or name like '%JAcket%' or team ~* 'redbull' or blurb ~* 'redbull'
  `;
  const existing = await sql<{ seeded: boolean }>`select seeded from shop_owner where id = 1`;
  if (!existing[0]?.seeded) {
    for (let i = 0; i < seedProducts.length; i++) {
      const product = seedProducts[i];
      if (!product) continue;
      await sql`
        insert into products (slug, name, team, sport, category, availability, region, kind, price, fan_price, box_price, box_fan_price, image, gallery, blurb, stock, sizes, size_chart, printable, hidden, season, sort_order)
        values (
          ${product.slug},
          ${product.name},
          ${product.team},
          ${coarseSport(product.category)},
          ${product.category},
          ${product.availability},
          ${product.region},
          ${product.kind},
          ${product.price},
          ${product.fanPrice},
          ${product.boxPrice},
          ${product.boxFanPrice},
          ${product.image},
          ${JSON.stringify(product.gallery ?? [])},
          ${product.blurb},
          ${product.stock},
          ${product.sizes.join(",")},
          ${product.sizeChart},
          ${product.printable},
          false,
          ${product.season},
          ${i}
        )
        on conflict (slug) do nothing
      `;
    }
    await sql`update shop_owner set seeded = true where id = 1`;
  }
  for (let i = 0; i < seedProducts.length; i++) {
    const product = seedProducts[i];
    if (!product) continue;
    await sql`
      insert into products (slug, name, team, sport, category, availability, region, kind, price, fan_price, box_price, box_fan_price, image, gallery, blurb, stock, sizes, size_chart, printable, hidden, season, sort_order)
      values (
        ${product.slug},
        ${product.name},
        ${product.team},
        ${coarseSport(product.category)},
        ${product.category},
        ${product.availability},
        ${product.region},
        ${product.kind},
        ${product.price},
        ${product.fanPrice},
        ${product.boxPrice},
        ${product.boxFanPrice},
        ${product.image},
        ${JSON.stringify(product.gallery ?? [])},
        ${product.blurb},
        ${product.stock},
        ${product.sizes.join(",")},
        ${product.sizeChart},
        ${product.printable},
        false,
        ${product.season},
        ${i}
      )
      on conflict (slug) do nothing
    `;
  }
  return sql;
}

function parseGallery(value: string | null | undefined, image: string) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string" && item !== image && isSafeImage(item)).slice(0, 5);
  } catch {
    return [];
  }
}

function isSafeImage(image: string) {
  if (image.startsWith("/catalog/") && !image.includes("..") && image.length < 200) return true;
  return /^data:image\/(jpeg|png|webp);base64,[a-z0-9+/=]+$/i.test(image);
}

type WriteInput = {
  slug: string;
  name: string;
  team: string;
  category: Category;
  availability: Availability;
  price: number;
  fanPrice: number;
  boxPrice: number | null;
  boxFanPrice: number | null;
  blurb: string;
  stock: number;
  image: string;
  gallery: string[];
  hidden: boolean;
  sizeChart: SizeChartId;
  printable: boolean;
  season: string;
};

function parseWrite(input: unknown): { ok: true; data: WriteInput } | { ok: false; error: string } {
  if (!input || typeof input !== "object") return { ok: false, error: "Missing kit." };
  const raw = input as Record<string, unknown>;
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  const team = typeof raw.team === "string" ? raw.team.trim() : "";
  const blurb = typeof raw.blurb === "string" ? raw.blurb.trim() : "";
  const category = raw.category;
  const availability = raw.availability;
  const price = Number(raw.price);
  const fanPrice = price;
  const boxPrice = null;
  const boxFanPrice = null;
  const stock = Number(raw.stock);
  const image = typeof raw.image === "string" ? raw.image.trim() : "";
  const gallery = parseGalleryInput(raw.gallery, image);
  const slug = typeof raw.slug === "string" ? raw.slug.trim() : "";
  const sizeChart = raw.sizeChart;
  const season = normalizeSeason(raw.season ?? "");
  if (season == null) return { ok: false, error: "Pick a shirt year, like 26/27 or 98/99." };
  if (name.length < 2 || name.length > 80) return { ok: false, error: "Name needs 2 to 80 characters." };
  if (team.length < 2 || team.length > 60) return { ok: false, error: "Add the team or club." };
  if (blurb.length > 400) return { ok: false, error: "Keep the description under 400 characters." };
  if (!isCategory(category)) return { ok: false, error: "Pick a category." };
  if (availability !== "on_hand" && availability !== "to_order") {
    return { ok: false, error: "Say if it is on hand or available to order." };
  }
  if (!isSizeChart(sizeChart)) return { ok: false, error: "Pick a size chart." };
  if (!Number.isInteger(price) || price < 1 || price > 50000) return { ok: false, error: "Price must be a whole rand amount." };
  if (!Number.isInteger(stock) || stock < 0 || stock > 999) return { ok: false, error: "Stock must be a whole number." };
  if (image && (!isSafeImage(image) || image.length > 1_200_000)) {
    return { ok: false, error: "That picture is too large or not a photo." };
  }
  if (!gallery.ok) return gallery;
  return {
    ok: true,
    data: {
      slug,
      name,
      team,
      category,
      availability,
      price,
      fanPrice,
      boxPrice,
      boxFanPrice,
      blurb,
      stock,
      image,
      gallery: gallery.data,
      hidden: raw.hidden === true,
      sizeChart,
      printable: raw.printable === true,
      season,
    },
  };
}

function parseGalleryInput(value: unknown, image: string): { ok: true; data: string[] } | { ok: false; error: string } {
  if (value == null) return { ok: true, data: [] };
  if (!Array.isArray(value)) return { ok: false, error: "Extra pictures were not a list." };
  const photos: string[] = [];
  for (const item of value) {
    if (typeof item !== "string" || !isSafeImage(item) || item.length > 1_200_000) {
      return { ok: false, error: "One of the extra pictures is too large or not a photo." };
    }
    if (item !== image && !photos.includes(item)) photos.push(item);
    if (photos.length === 5) break;
  }
  return { ok: true, data: photos };
}

function slugify(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return base || "kit";
}

export const listPublicProducts = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const sql = await ready();
    const rows = await sql<Row>`
      select slug, name, team, sport, category, availability, region, kind, price, fan_price, box_price, box_fan_price, image, blurb, stock, sizes, size_chart, printable, hidden, season, gallery
      from products
      where hidden = false
      order by sort_order, name
    `;
    const stamp = await sql<{ n: number; stamp: string }>`
      select count(*)::int as n, coalesce(max(updated_at)::text, '') as stamp
      from products
      where hidden = false
    `;
    return {
      products: rows.map(toProduct),
      version: `${Number(stamp[0]?.n ?? rows.length)}:${stamp[0]?.stamp ?? ""}`,
    };
  } catch {
    return {
      products: seedProducts,
      version: "seed",
    };
  }
});

export const catalogVersion = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const sql = await ready();
    const stamp = await sql<{ n: number; stamp: string }>`
      select count(*)::int as n, coalesce(max(updated_at)::text, '') as stamp
      from products
      where hidden = false
    `;
    return `${Number(stamp[0]?.n ?? 0)}:${stamp[0]?.stamp ?? ""}`;
  } catch {
    return "seed";
  }
});

export const loadDesk = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await ready();
    const ownerRows = await sql<{ user_id: string | null }>`select user_id from shop_owner where id = 1`;
    const owner = ownerRows[0]?.user_id ?? null;
    if (!owner) return { state: "unclaimed" as const, products: [] as AdminProduct[] };
    if (owner !== context.userId) return { state: "taken" as const, products: [] as AdminProduct[] };
    const rows = await sql<Row>`
      select slug, name, team, sport, category, availability, region, kind, price, fan_price, box_price, box_fan_price, image, blurb, stock, sizes, size_chart, printable, hidden, season, gallery
      from products
      order by sort_order, name
    `;
    return { state: "owner" as const, products: rows.map(toAdmin) };
  });

export const claimDesk = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await ready();
    const claimed = await sql<{ user_id: string }>`
      update shop_owner
      set user_id = ${context.userId}
      where id = 1 and user_id is null
      returning user_id
    `;
    if (claimed.length > 0) return { state: "owner" as const };
    const ownerRows = await sql<{ user_id: string | null }>`select user_id from shop_owner where id = 1`;
    return { state: ownerRows[0]?.user_id === context.userId ? ("owner" as const) : ("taken" as const) };
  });

export const saveProduct = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const parsed = parseWrite(data);
    if (!parsed.ok) return { ok: false as const, error: parsed.error };
    const sql = await ready();
    const ownerRows = await sql<{ user_id: string | null }>`select user_id from shop_owner where id = 1`;
    if (ownerRows[0]?.user_id !== context.userId) {
      return { ok: false as const, error: "Only the shop owner can change the rail." };
    }
    const input = parsed.data;
    const image = input.image || "/catalog/hero.jpg";
    if (!isSafeImage(image)) return { ok: false as const, error: "Add a picture of the kit." };

    const sizes = sizesFor(input.sizeChart).join(",");
    if (input.slug) {
      const rows = await sql<Row>`
        update products
        set name = ${input.name},
            team = ${input.team},
            sport = ${coarseSport(input.category)},
            category = ${input.category},
            availability = ${input.availability},
            price = ${input.price},
            fan_price = ${input.fanPrice},
            box_price = ${input.boxPrice},
            box_fan_price = ${input.boxFanPrice},
            blurb = ${input.blurb},
            stock = ${input.stock},
            hidden = ${input.hidden},
            image = ${image},
            gallery = ${JSON.stringify(input.gallery)},
            size_chart = ${input.sizeChart},
            printable = ${input.printable},
            sizes = ${sizes},
            season = ${input.season},
            updated_at = now()
        where slug = ${input.slug}
        returning slug, name, team, sport, category, availability, region, kind, price, fan_price, box_price, box_fan_price, image, blurb, stock, sizes, size_chart, printable, hidden, season, gallery
      `;
      const row = rows[0];
      if (!row) return { ok: false as const, error: "That kit is no longer on the rail." };
      return { ok: true as const, product: toAdmin(row) };
    }

    let slug = slugify(input.name);
    for (let n = 2; n < 40; n++) {
      const found = await sql<{ slug: string }>`select slug from products where slug = ${slug}`;
      if (found.length === 0) break;
      slug = `${slugify(input.name)}-${n}`;
    }
    const orderRows = await sql<{ next: number }>`select coalesce(min(sort_order), 0) - 1 as next from products`;
    const sortOrder = Number(orderRows[0]?.next ?? 0);
    const rows = await sql<Row>`
      insert into products (slug, name, team, sport, category, availability, region, kind, price, fan_price, box_price, box_fan_price, image, gallery, blurb, stock, sizes, size_chart, printable, hidden, season, sort_order)
      values (
        ${slug},
        ${input.name},
        ${input.team},
        ${coarseSport(input.category)},
        ${input.category},
        ${input.availability},
        'international',
        'jersey',
        ${input.price},
        ${input.fanPrice},
        ${input.boxPrice},
        ${input.boxFanPrice},
        ${image},
        ${JSON.stringify(input.gallery)},
        ${input.blurb},
        ${input.stock},
        ${sizes},
        ${input.sizeChart},
        ${input.printable},
        ${input.hidden},
        ${input.season},
        ${sortOrder}
      )
      returning slug, name, team, sport, category, availability, region, kind, price, fan_price, box_price, box_fan_price, image, blurb, stock, sizes, size_chart, printable, hidden, season
    `;
    const row = rows[0];
    if (!row) return { ok: false as const, error: "Could not add that kit." };
    return { ok: true as const, product: toAdmin(row) };
  });

export const removeProduct = createServerFn({ method: "POST" })
  .validator((slug: unknown) => (typeof slug === "string" ? slug.trim() : ""))
  .middleware([authMiddleware])
  .handler(async ({ context, data: slug }) => {
    if (!slug) return { ok: false as const, error: "Missing kit." };
    const sql = await ready();
    const ownerRows = await sql<{ user_id: string | null }>`select user_id from shop_owner where id = 1`;
    if (ownerRows[0]?.user_id !== context.userId) {
      return { ok: false as const, error: "Only the shop owner can change the rail." };
    }
    await sql`delete from products where slug = ${slug}`;
    return { ok: true as const };
  });
