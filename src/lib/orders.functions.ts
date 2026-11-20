import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import {
  isBloemfontein,
  isDelivery,
  isOrderStatus,
  isOffer,
  isShirtVersion,
  phoneKey,
  shippingFee,
  normalizeSeason,
  type Delivery,
  type Offer,
  type OrderStatus,
  type ShirtVersion,
} from "@/data/catalog";
import { cleanPrintName, cleanPrintNumber, PRINT_BADGES } from "@/data/size-charts";
import type { OrderLine, PrintSpec } from "@/lib/store";
import { pushSharedCatalog, pullSharedCatalog } from "@/lib/shared-catalog";

type ProductRow = {
  slug: string;
  name: string;
  team: string;
  price: number;
  fan_price: number;
  box_price: number | null;
  box_fan_price: number | null;
  image: string;
  stock: number;
  availability: string;
  printable: boolean;
  hidden: boolean;
  sizes: string;
};

export type TrackedOrder = {
  id: string;
  createdAt: string;
  status: OrderStatus;
  delivery: string;
  subtotal: number;
  shipping: number;
  total: number;
  lines: { name: string; size: string; qty: number; version?: string; offer?: string; print: PrintSpec | null }[];
};

export type DeskOrder = TrackedOrder & {
  customerName: string;
  phone: string;
  email: string;
  city: string;
  notes: string;
};

export type BulkEnquiry = {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  email: string;
  organisation: string;
  details: string;
  status: string;
};

function blankPrint(): PrintSpec {
  return { on: false, name: "", number: "", badges: [] };
}

async function ownerSql(userId: string) {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const rows = await sql<{ user_id: string | null }>`select user_id from shop_owner where id = 1`;
  if (rows[0]?.user_id !== userId) return null;
  return sql;
}

export const placeShopOrder = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(async ({ data }) => {
    if (!data || typeof data !== "object") return { ok: false as const, error: "Missing order." };
    const raw = data as Record<string, unknown>;
    const customer = raw.customer;
    if (!customer || typeof customer !== "object") return { ok: false as const, error: "Missing customer." };
    const c = customer as Record<string, unknown>;
    const name = typeof c.name === "string" ? c.name.trim() : "";
    const phone = typeof c.phone === "string" ? c.phone.trim() : "";
    const email = typeof c.email === "string" ? c.email.trim() : "";
    const notes = typeof c.notes === "string" ? c.notes.trim().slice(0, 500) : "";
    const delivery = c.delivery;
    if (name.length < 2 || name.length > 80) return { ok: false as const, error: "Add the name on the order." };
    if (phoneKey(phone).length < 9) return { ok: false as const, error: "Add a phone number we can reach on WhatsApp." };
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false as const, error: "That email does not look right." };
    if (!isDelivery(delivery)) return { ok: false as const, error: "Choose how you want it sent." };
    const needsAddress = delivery !== "collection";
    const line1 = typeof c.line1 === "string" ? c.line1.trim() : "";
    const suburb = typeof c.suburb === "string" ? c.suburb.trim() : "";
    const city = typeof c.city === "string" ? c.city.trim() : "";
    const province = typeof c.province === "string" ? c.province.trim() : "";
    const postal = typeof c.postal === "string" ? c.postal.trim() : "";
    if (needsAddress) {
      if (line1.length < 3 || suburb.length < 2 || city.length < 2 || province.length < 2 || postal.length < 4) {
        return { ok: false as const, error: "Add the full delivery address." };
      }
    }
    if (delivery === "bloem" && (!isBloemfontein(city) || province !== "Free State")) {
      return {
        ok: false as const,
        error: "Free delivery is only for Bloemfontein in the Free State. Choose a courier for any other city.",
      };
    }
    if (!Array.isArray(raw.lines) || raw.lines.length === 0 || raw.lines.length > 20) {
      return { ok: false as const, error: "Your bag is empty." };
    }
    const requested: { slug: string; size: string; qty: number; print: PrintSpec; version: ShirtVersion; offer?: "stock" | "single" }[] = [];
    for (const item of raw.lines) {
      if (!item || typeof item !== "object") return { ok: false as const, error: "A kit in the bag is not valid." };
      const line = item as Record<string, unknown>;
      const slug = typeof line.productId === "string" ? line.productId.trim() : "";
      const size = typeof line.size === "string" ? line.size.trim() : "";
      const qty = Number(line.qty);
      if (!slug || !size || !Number.isInteger(qty) || qty < 1 || qty > 6) {
        return { ok: false as const, error: "Check the sizes and quantities." };
      }
      const printRaw = line.print;
      let print = blankPrint();
      if (printRaw && typeof printRaw === "object") {
        const p = printRaw as Record<string, unknown>;
        if (p.on === true) {
          const badges = Array.isArray(p.badges) ? p.badges.filter((id): id is string => typeof id === "string") : [];
          print = {
            on: true,
            name: cleanPrintName(typeof p.name === "string" ? p.name : "").trim(),
            number: cleanPrintNumber(typeof p.number === "string" ? p.number : ""),
            badges: PRINT_BADGES.filter((badge) => badges.includes(badge.id)).map((badge) => badge.id),
          };
          if (!print.name && !print.number && print.badges.length === 0) {
            return { ok: false as const, error: "Add a name, a number, or a badge — or choose no printing." };
          }
        }
      }
      requested.push({
        slug,
        size,
        qty,
        print,
        version: isShirtVersion(line.version) ? line.version : "player",
        offer: isOffer(line.offer) ? line.offer : undefined,
      });
    }

    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const slugs = [...new Set(requested.map((line) => line.slug))];
    const products = await sql<ProductRow>`
      select slug, name, team, price, fan_price, box_price, box_fan_price, image, stock, availability, printable, hidden, sizes
      from products
      where slug = any(${slugs})
    `;
    const bySlug = new Map(products.map((row) => [row.slug, row]));
    const priced: OrderLine[] = [];
    const need = new Map<string, number>();
    for (const line of requested) {
      const product = bySlug.get(line.slug);
      if (!product || product.hidden) return { ok: false as const, error: "A kit in the bag is no longer listed." };
      const sizes = product.sizes.split(",").map((size) => size.trim());
      if (!sizes.includes(line.size)) return { ok: false as const, error: `${product.name} is not sold in size ${line.size}.` };
      const print = product.printable ? line.print : blankPrint();
      if (line.print.on && !product.printable) {
        return { ok: false as const, error: `${product.name} is not printed.` };
      }
      const unit = Number(product.price);
      const inStock = product.availability !== "to_order" && Number(product.stock) > 0;
      const offer: Offer = inStock ? "stock" : "single";
      priced.push({
        productId: product.slug,
        name: product.name,
        team: product.team,
        size: line.size,
        qty: line.qty,
        price: unit,
        version: "player",
        offer,
        image: product.image,
        print,
        availability: offer === "stock" ? "on_hand" : "to_order",
      });
      if (offer === "stock") {
        need.set(product.slug, (need.get(product.slug) ?? 0) + line.qty);
      }
    }
    for (const [slug, qty] of need) {
      const product = bySlug.get(slug);
      if (!product || Number(product.stock) < qty) {
        return { ok: false as const, error: `${product?.name ?? "A kit"} does not have enough on hand. Lower the quantity or pick available to order.` };
      }
    }

    const subtotal = priced.reduce((sum, line) => sum + line.price * line.qty, 0);
    const shipping = shippingFee(subtotal, delivery);
    const total = subtotal + shipping;
    if (raw.quote === true) {
      return { ok: true as const, quote: true as const, id: "", subtotal, shipping, total, lines: priced, delivery: delivery as Delivery };
    }
    const id = `JIS-${Date.now().toString(36).toUpperCase()}`;
    const stockTaken = need.size > 0;
    const needSlugs = [...need.keys()];
    const needQty = needSlugs.map((slug) => need.get(slug) ?? 0);
    const savedCity = needsAddress ? city : "Bloemfontein";
    const savedProvince = needsAddress ? province : "Free State";

    const placed = await sql.query<{ id: string | null; short: string | null }>(
      `with need as (
         select * from unnest($1::text[], $2::int[]) as t(slug, qty)
       ),
       short as (
         select p.name as slug
         from products p
         join need n on n.slug = p.slug
         where p.availability = 'on_hand' and p.stock < n.qty
       ),
       updated as (
         update products p
         set stock = p.stock - n.qty, updated_at = now()
         from need n
         where p.slug = n.slug
           and p.availability = 'on_hand'
           and not exists (select 1 from short)
         returning p.slug
       ),
       inserted as (
         insert into shop_orders (
           id, status, customer_name, phone, phone_key, email, line1, suburb, city, province, postal, notes,
           delivery, subtotal, shipping, total, lines, stock_taken
         )
         select $3, 'received', $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18::jsonb, $19
         where not exists (select 1 from short)
         returning id
       )
       select (select id from inserted) as id, (select string_agg(slug, ', ') from short) as short`,
      [
        needSlugs,
        needQty,
        id,
        name,
        phone,
        phoneKey(phone),
        email,
        needsAddress ? line1 : "",
        needsAddress ? suburb : "",
        savedCity,
        savedProvince,
        needsAddress ? postal : "",
        notes,
        delivery,
        subtotal,
        shipping,
        total,
        JSON.stringify(priced),
        stockTaken,
      ],
    );
    const row = placed[0];
    if (row?.short) return { ok: false as const, error: `${row.short} just sold out. Lower the quantity.` };
    if (!row?.id) return { ok: false as const, error: "Could not save the order. Try again." };
    const customerId = typeof raw.customerId === "string" ? raw.customerId.trim() : "";
    if (customerId.startsWith("CUS-")) {
      await sql`alter table shop_orders add column if not exists customer_id text not null default ''`;
      await sql`update shop_orders set customer_id = ${customerId} where id = ${row.id}`;
    }
    if (stockTaken) await pushSharedCatalog(sql);
    return { ok: true as const, id, subtotal, shipping, total, lines: priced, delivery: delivery as Delivery };
  });

export const trackShopOrder = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(async ({ data }) => {
    if (!data || typeof data !== "object") return { ok: false as const, error: "Enter the order code and phone number." };
    const raw = data as Record<string, unknown>;
    const id = typeof raw.id === "string" ? raw.id.trim().toUpperCase() : "";
    const key = phoneKey(typeof raw.phone === "string" ? raw.phone : "");
    if (id.length < 4 || key.length < 9) return { ok: false as const, error: "Enter the order code and the WhatsApp number used at checkout." };
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      created_at: string;
      status: string;
      delivery: string;
      subtotal: number;
      shipping: number;
      total: number;
      lines: OrderLine[] | string;
    }>`
      select id, created_at::text as created_at, status, delivery, subtotal, shipping, total, lines
      from shop_orders
      where id = ${id} and phone_key = ${key}
    `;
    const row = rows[0];
    if (!row || !isOrderStatus(row.status)) return { ok: false as const, error: "No order matches that code and phone number." };
    const lines = typeof row.lines === "string" ? (JSON.parse(row.lines) as OrderLine[]) : row.lines;
    const order: TrackedOrder = {
      id: row.id,
      createdAt: row.created_at,
      status: row.status,
      delivery: row.delivery,
      subtotal: Number(row.subtotal),
      shipping: Number(row.shipping),
      total: Number(row.total),
      lines: (Array.isArray(lines) ? lines : []).map((line) => ({
        name: line.name,
        size: line.size,
        qty: line.qty,
        version: line.version,
        offer: line.offer,
        print: line.print ?? null,
      })),
    };
    return { ok: true as const, order };
  });

export const listDeskOrders = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await ownerSql(context.userId);
    if (!sql) return { ok: false as const, error: "Only the shop owner can see orders." };
    const rows = await sql<{
      id: string;
      created_at: string;
      status: string;
      delivery: string;
      subtotal: number;
      shipping: number;
      total: number;
      lines: OrderLine[] | string;
      customer_name: string;
      phone: string;
      email: string;
      city: string;
      notes: string;
    }>`
      select id, created_at::text, status, delivery, subtotal, shipping, total, lines,
             customer_name, phone, email, city, notes
      from shop_orders
      order by created_at desc
      limit 80
    `;
    const orders: DeskOrder[] = rows.map((row) => {
      const lines = typeof row.lines === "string" ? (JSON.parse(row.lines) as OrderLine[]) : row.lines;
      return {
        id: row.id,
        createdAt: row.created_at,
        status: isOrderStatus(row.status) ? row.status : "received",
        delivery: row.delivery,
        subtotal: Number(row.subtotal),
        shipping: Number(row.shipping),
        total: Number(row.total),
        customerName: row.customer_name,
        phone: row.phone,
        email: row.email,
        city: row.city,
        notes: row.notes,
        lines: (Array.isArray(lines) ? lines : []).map((line) => ({
          name: line.name,
          size: line.size,
          qty: line.qty,
          version: line.version,
          offer: line.offer,
          print: line.print ?? null,
        })),
      };
    });
    return { ok: true as const, orders };
  });

export const setOrderStatus = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await ownerSql(context.userId);
    if (!sql) return { ok: false as const, error: "Only the shop owner can update an order." };
    if (!data || typeof data !== "object") return { ok: false as const, error: "Missing order." };
    const raw = data as Record<string, unknown>;
    const id = typeof raw.id === "string" ? raw.id.trim() : "";
    const status = raw.status;
    if (!id || !isOrderStatus(status)) return { ok: false as const, error: "Pick a status." };
    await sql.query(
      `with prev as (
         select id, status, lines, stock_taken from shop_orders where id = $1
       ),
       upd as (
         update shop_orders o
         set status = $2, updated_at = now()
         from prev
         where o.id = prev.id and prev.status is distinct from $2
         returning o.id
       ),
       restore as (
         update products p
         set stock = p.stock + x.qty, updated_at = now()
         from (
           select line->>'productId' as slug, sum((line->>'qty')::int) as qty
           from prev, jsonb_array_elements(prev.lines) line
           where prev.stock_taken
             and prev.status <> 'cancelled'
             and $2 = 'cancelled'
             and coalesce(line->>'availability', '') = 'on_hand'
           group by 1
         ) x
         where p.slug = x.slug
         returning p.slug
       )
       select (select count(*) from upd) as changed`,
      [id, status],
    );
    await pushSharedCatalog(sql);
    return { ok: true as const };
  });

export const setStock = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await ownerSql(context.userId);
    if (!sql) return { ok: false as const, error: "Only the shop owner can change stock." };
    if (!data || typeof data !== "object") return { ok: false as const, error: "Missing kit." };
    const raw = data as Record<string, unknown>;
    const slug = typeof raw.slug === "string" ? raw.slug.trim() : "";
    const stock = Number(raw.stock);
    const season = normalizeSeason(typeof raw.season === "string" ? raw.season : "");
    if (!slug || !Number.isInteger(stock) || stock < 0 || stock > 999) {
      return { ok: false as const, error: "Stock must be a whole number from 0 to 999." };
    }
    if (season == null) return { ok: false as const, error: "Pick a shirt year, like 26/27 or 98/99." };
    await pullSharedCatalog(sql);
    const rows = await sql<{ slug: string }>`
      update products set stock = ${stock}, season = ${season}, updated_at = now() where slug = ${slug} returning slug
    `;
    if (!rows[0]) return { ok: false as const, error: "That kit is not on the rail." };
    await pushSharedCatalog(sql);
    return { ok: true as const };
  });

export const sendBulkEnquiry = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(async ({ data }) => {
    if (!data || typeof data !== "object") return { ok: false as const, error: "Missing the enquiry." };
    const raw = data as Record<string, unknown>;
    const name = typeof raw.name === "string" ? raw.name.trim() : "";
    const phone = typeof raw.phone === "string" ? raw.phone.trim() : "";
    const email = typeof raw.email === "string" ? raw.email.trim() : "";
    const organisation = typeof raw.organisation === "string" ? raw.organisation.trim().slice(0, 80) : "";
    const details = typeof raw.details === "string" ? raw.details.trim() : "";
    if (name.length < 2) return { ok: false as const, error: "Add your name." };
    if (phoneKey(phone).length < 9) return { ok: false as const, error: "Add a WhatsApp number." };
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false as const, error: "That email does not look right." };
    if (details.length < 8 || details.length > 2000) {
      return { ok: false as const, error: "Say what you need: kits, sizes, quantities and when you need them." };
    }
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const id = `BULK-${Date.now().toString(36).toUpperCase()}`;
    await sql`
      insert into bulk_enquiries (id, name, phone, email, organisation, details)
      values (${id}, ${name}, ${phone}, ${email}, ${organisation}, ${details})
    `;
    return { ok: true as const, id };
  });

export const listBulkEnquiries = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await ownerSql(context.userId);
    if (!sql) return { ok: false as const, error: "Only the shop owner can see bulk enquiries." };
    const rows = await sql<{
      id: string;
      created_at: string;
      name: string;
      phone: string;
      email: string;
      organisation: string;
      details: string;
      status: string;
    }>`
      select id, created_at::text, name, phone, email, organisation, details, status
      from bulk_enquiries
      order by created_at desc
      limit 80
    `;
    const enquiries: BulkEnquiry[] = rows.map((row) => ({
      id: row.id,
      createdAt: row.created_at,
      name: row.name,
      phone: row.phone,
      email: row.email,
      organisation: row.organisation,
      details: row.details,
      status: row.status,
    }));
    return { ok: true as const, enquiries };
  });

export const setBulkStatus = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await ownerSql(context.userId);
    if (!sql) return { ok: false as const, error: "Only the shop owner can update an enquiry." };
    if (!data || typeof data !== "object") return { ok: false as const, error: "Missing enquiry." };
    const raw = data as Record<string, unknown>;
    const id = typeof raw.id === "string" ? raw.id.trim() : "";
    const status = raw.status === "contacted" ? "contacted" : raw.status === "new" ? "new" : "";
    if (!id || !status) return { ok: false as const, error: "Pick a status." };
    await sql`update bulk_enquiries set status = ${status} where id = ${id}`;
    return { ok: true as const };
  });

export const listCustomerOrders = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(async ({ data }) => {
    if (!data || typeof data !== "object") return { ok: false as const, error: "Sign in first.", orders: [] as StoredOrder[] };
    const id = typeof (data as { customerId?: unknown }).customerId === "string" ? (data as { customerId: string }).customerId.trim() : "";
    if (!id.startsWith("CUS-")) return { ok: false as const, error: "Sign in first.", orders: [] as StoredOrder[] };
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`alter table shop_orders add column if not exists customer_id text not null default ''`;
    const rows = await sql<{
      id: string;
      created_at: string;
      delivery: string;
      subtotal: number;
      shipping: number;
      total: number;
      lines: OrderLine[] | string;
      customer_name: string;
      phone: string;
      email: string;
    }>`
      select id, created_at::text as created_at, delivery, subtotal, shipping, total, lines, customer_name, phone, email
      from shop_orders
      where customer_id = ${id}
      order by created_at desc
      limit 40
    `;
    const orders: StoredOrder[] = rows.map((row) => ({
      id: row.id,
      createdAt: row.created_at,
      lines: typeof row.lines === "string" ? (JSON.parse(row.lines) as OrderLine[]) : row.lines,
      customer: {
        name: row.customer_name,
        email: row.email,
        phone: row.phone,
        line1: "",
        suburb: "",
        city: "",
        province: "",
        postal: "",
        notes: "",
        delivery: row.delivery as Delivery,
      },
      subtotal: Number(row.subtotal),
      shipping: Number(row.shipping),
      total: Number(row.total),
    }));
    return { ok: true as const, orders };
  });

type StoredOrder = {
  id: string;
  createdAt: string;
  lines: OrderLine[];
  customer: {
    name: string;
    email: string;
    phone: string;
    line1: string;
    suburb: string;
    city: string;
    province: string;
    postal: string;
    notes: string;
    delivery: Delivery;
  };
  subtotal: number;
  shipping: number;
  total: number;
};
