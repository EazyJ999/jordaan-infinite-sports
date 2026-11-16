import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { placeShopOrder } from "@/lib/orders.functions";

type Settings = { clientId: string; secret: string; live: boolean };

async function settingsSql() {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  await sql`
    create table if not exists shop_settings (
      key text primary key,
      value text not null
    )
  `;
  await sql`
    create table if not exists paypal_pending (
      paypal_id text primary key,
      payload jsonb not null,
      created_at timestamptz not null default now()
    )
  `;
  return sql;
}

async function readSettings(): Promise<Settings | null> {
  const sql = await settingsSql();
  const rows = await sql<{ key: string; value: string }>`select key, value from shop_settings where key like 'paypal_%'`;
  const map = new Map(rows.map((row) => [row.key, row.value]));
  const clientId = map.get("paypal_client_id")?.trim() ?? "";
  const secret = map.get("paypal_secret")?.trim() ?? "";
  if (clientId.length < 8 || secret.length < 8) return null;
  return { clientId, secret, live: map.get("paypal_live") !== "0" };
}

async function accessToken(cfg: Settings) {
  const root = cfg.live ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
  const response = await fetch(`${root}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${cfg.clientId}:${cfg.secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!response.ok) return null;
  const body = (await response.json()) as { access_token?: string };
  if (!body.access_token) return null;
  return { root, token: body.access_token };
}

export const paypalStatus = createServerFn({ method: "GET" }).handler(async () => {
  const cfg = await readSettings();
  return { enabled: Boolean(cfg), clientId: cfg?.clientId ?? "", live: cfg?.live ?? true };
});

export const savePayPal = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => input)
  .handler(async ({ data, context }) => {
    if (!data || typeof data !== "object") return { ok: false as const, error: "Missing PayPal details." };
    const raw = data as Record<string, unknown>;
    const clientId = typeof raw.clientId === "string" ? raw.clientId.trim() : "";
    const secret = typeof raw.secret === "string" ? raw.secret.trim() : "";
    const live = raw.live !== false;
    if (clientId.length < 8 || secret.length < 8) return { ok: false as const, error: "Paste the client ID and the secret from PayPal." };
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const owner = await sql<{ user_id: string | null }>`select user_id from shop_owner where id = 1`;
    if (owner[0]?.user_id !== context.userId) return { ok: false as const, error: "Only the shop owner can link PayPal." };
    await settingsSql();
    await sql`insert into shop_settings (key, value) values ('paypal_client_id', ${clientId}) on conflict (key) do update set value = excluded.value`;
    await sql`insert into shop_settings (key, value) values ('paypal_secret', ${secret}) on conflict (key) do update set value = excluded.value`;
    await sql`insert into shop_settings (key, value) values ('paypal_live', ${live ? "1" : "0"}) on conflict (key) do update set value = excluded.value`;
    return { ok: true as const };
  });

export const createPayPalOrder = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(async ({ data }) => {
    const cfg = await readSettings();
    if (!cfg) return { ok: false as const, error: "PayPal is not linked yet." };
    if (!data || typeof data !== "object") return { ok: false as const, error: "Missing order." };
    const quote = await placeShopOrder({ data: { ...(data as object), quote: true } });
    if (!quote.ok) return quote;
    const auth = await accessToken(cfg);
    if (!auth) return { ok: false as const, error: "PayPal did not accept the business login. Check the client ID and secret." };
    const response = await fetch(`${auth.root}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${auth.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: { currency_code: "ZAR", value: quote.total.toFixed(2) },
            description: "Jordaan Infinite Sports",
          },
        ],
      }),
    });
    const body = (await response.json()) as { id?: string };
    if (!response.ok || !body.id) return { ok: false as const, error: "PayPal could not start this payment." };
    const sql = await settingsSql();
    await sql`insert into paypal_pending (paypal_id, payload) values (${body.id}, ${JSON.stringify(data)}::jsonb) on conflict (paypal_id) do update set payload = excluded.payload`;
    return { ok: true as const, paypalId: body.id };
  });

export const capturePayPalOrder = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(async ({ data }) => {
    const cfg = await readSettings();
    if (!cfg) return { ok: false as const, error: "PayPal is not linked yet." };
    const paypalId = data && typeof data === "object" && typeof (data as { paypalId?: string }).paypalId === "string"
      ? (data as { paypalId: string }).paypalId.trim()
      : "";
    if (!paypalId) return { ok: false as const, error: "Missing PayPal payment." };
    const sql = await settingsSql();
    const pending = await sql<{ payload: unknown }>`select payload from paypal_pending where paypal_id = ${paypalId}`;
    const payload = pending[0]?.payload;
    if (!payload || typeof payload !== "object") return { ok: false as const, error: "This payment does not match an order." };
    const auth = await accessToken(cfg);
    if (!auth) return { ok: false as const, error: "PayPal did not accept the business login." };
    const response = await fetch(`${auth.root}/v2/checkout/orders/${encodeURIComponent(paypalId)}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${auth.token}`,
        "Content-Type": "application/json",
      },
    });
    const body = (await response.json()) as { status?: string };
    if (!response.ok || body.status !== "COMPLETED") return { ok: false as const, error: "PayPal did not complete the payment." };
    const raw = payload as { customer?: { notes?: string } };
    if (raw.customer && typeof raw.customer === "object") {
      const note = typeof raw.customer.notes === "string" ? raw.customer.notes : "";
      raw.customer.notes = `${note}\nPaid with PayPal ${paypalId}.`.trim();
    }
    const placed = await placeShopOrder({ data: raw });
    await sql`delete from paypal_pending where paypal_id = ${paypalId}`;
    if (!placed.ok || placed.quote) return { ok: false as const, error: placed.ok ? "Could not save the order." : placed.error };
    return placed;
  });
