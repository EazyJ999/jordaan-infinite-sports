import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { AccountGate } from "@/components/account-gate";
import { NoReturnNotice } from "@/components/no-return";
import {
  COLLECTION_ADDRESS,
  COLLECTION_HOURS,
  DELIVERIES,
  PROVINCES,
  formatMoney,
  isBloemfontein,
  lineOffer,
  shippingFee,
  shirtPrice,
  shopQuery,
  type Delivery,
  type ShirtVersion,
} from "@/data/catalog";
import { PRINT_BADGES, cleanPrintName, cleanPrintNumber } from "@/data/size-charts";
import { pingCatalog, useCatalog } from "@/lib/catalog-context";
import { placeShopOrder } from "@/lib/orders.functions";
import { PayPalCheckout } from "@/components/paypal-checkout";
import { useShop, type PrintSpec } from "@/lib/store";
import { useHydrated } from "@/lib/use-hydrated";
import { describePrint, orderMessage, whatsAppUrl, WHATSAPP_DISPLAY } from "@/lib/whatsapp-order";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout · J.I.S" }] }),
  component: CheckoutPage,
});

const empty = {
  name: "",
  email: "",
  phone: "",
  line1: "",
  suburb: "",
  city: "",
  province: "Free State",
  postal: "",
  notes: "",
  delivery: "courier_guy" as Delivery,
};

function blankPrint(): PrintSpec {
  return { on: false, name: "", number: "", badges: [] };
}

function lineKey(productId: string, size: string, version: string, offer: string) {
  return `${productId}::${size}::${version}::${offer}`;
}

function CheckoutPage() {
  const hydrated = useHydrated();
  const lines = useShop((s) => s.lines);
  const placeOrder = useShop((s) => s.placeOrder);
  const account = useShop((s) => s.account);
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [prints, setPrints] = useState<Record<string, PrintSpec>>({});
  const [ack, setAck] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const { products } = useCatalog();

  useEffect(() => {
    if (!account) return;
    setForm((current) => ({
      ...current,
      name: current.name || account.name,
      email: current.email || account.email,
      phone: current.phone || account.phone,
    }));
  }, [account]);

  const detailed = lines
    .map((line) => {
      const product = products.find((item) => item.slug === line.productId);
      return product ? { line, product } : null;
    })
    .filter((row) => row !== null);

  const subtotal = detailed.reduce((sum, row) => {
    const offer = lineOffer(row.line, row.product);
    return sum + shirtPrice(row.product, row.line.version ?? "player", row.line.size, offer) * row.line.qty;
  }, 0);
  const shipping = shippingFee(subtotal, form.delivery);
  const total = subtotal + shipping;
  const needsAddress = form.delivery !== "collection";
  const anyPrintable = detailed.some((row) => row.product.printable);

  function specFor(key: string) {
    return prints[key] ?? blankPrint();
  }

  function update<K extends keyof typeof empty>(key: K, value: (typeof empty)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function chooseDelivery(delivery: Delivery) {
    setForm((current) => ({
      ...current,
      delivery,
      city: delivery === "bloem" && !current.city.trim() ? "Bloemfontein" : current.city,
      province: delivery === "bloem" ? "Free State" : current.province,
    }));
  }

  function setPrint(key: string, next: PrintSpec) {
    setPrints((current) => ({ ...current, [key]: next }));
  }

  function collectOrder() {
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next.name = "Add the name on the order.";
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = "That email does not look right.";
    if (form.phone.replace(/\D/g, "").length < 10) next.phone = "Add a phone number we can reach on WhatsApp.";
    if (needsAddress) {
      if (form.line1.trim().length < 3) next.line1 = "Street address is required.";
      if (form.suburb.trim().length < 2) next.suburb = "Suburb is required.";
      if (form.city.trim().length < 2) next.city = "City is required.";
      if (form.delivery === "bloem" && !isBloemfontein(form.city)) next.city = "Free delivery is only for Bloemfontein. Choose a courier for any other city.";
      if (!form.province) next.province = "Pick a province.";
      if (form.delivery === "bloem" && form.province !== "Free State") next.province = "Free delivery is only in the Free State.";
      if (form.postal.trim().length < 4) next.postal = "Postal code is required.";
    }
    if (detailed.length === 0) next.bag = "Your bag is empty.";
    let printing = false;
    const priced = detailed.map(({ line, product }) => {
      const offer = lineOffer(line, product);
      const key = lineKey(line.productId, line.size, line.version ?? "player", offer);
      const raw = specFor(key);
      const print = !product.printable
        ? blankPrint()
        : raw.on
          ? {
              on: true,
              name: cleanPrintName(raw.name).trim(),
              number: cleanPrintNumber(raw.number),
              badges: PRINT_BADGES.filter((badge) => raw.badges.includes(badge.id)).map((badge) => badge.id),
            }
          : blankPrint();
      if (print.on) {
        printing = true;
        if (!print.name && !print.number && print.badges.length === 0) next[key] = "Add a name, a number, or a badge — or choose no printing.";
      }
      return {
        productId: product.slug,
        name: product.name,
        team: product.team,
        size: line.size,
        qty: line.qty,
        price: shirtPrice(product, line.version ?? "player", line.size, offer),
        version: (line.version ?? "player") as ShirtVersion,
        offer,
        image: product.image,
        print,
      };
    });
    if (printing && !ack) next.ack = "Tick this before sending. Custom printing cannot be refunded or returned.";
    setErrors(next);
    if (Object.keys(next).length > 0) return null;
    return {
      customer: {
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        line1: needsAddress ? form.line1.trim() : "",
        suburb: needsAddress ? form.suburb.trim() : "",
        city: needsAddress ? form.city.trim() : "Bloemfontein",
        province: needsAddress ? form.province : "Free State",
        postal: needsAddress ? form.postal.trim() : "",
        notes: form.notes.trim(),
      },
      lines: priced,
    };
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const payload = collectOrder();
    if (!payload) return;
    const popup = window.open("about:blank", "_blank");
    setSending(true);
    try {
      const result = await placeShopOrder({ data: payload });
      if (!result.ok || !result.id) {
        popup?.close();
        setErrors({ bag: result.ok ? "Could not save the order." : result.error });
        setSending(false);
        return;
      }
      const text = orderMessage({
        id: result.id,
        customer: payload.customer,
        lines: result.lines,
        subtotal: result.subtotal,
        shipping: result.shipping,
        total: result.total,
      });
      const url = whatsAppUrl(text);
      if (popup) popup.location.href = url;
      placeOrder(payload.customer, result.lines, result.subtotal, result.shipping, result.id);
      pingCatalog();
      void navigate({ to: "/order/$id", params: { id: result.id } });
    } catch (err) {
      popup?.close();
      setErrors({ bag: err instanceof Error ? err.message : "Could not place the order." });
      setSending(false);
    }
  }

  if (!hydrated) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16">
        <p className="text-muted">Loading your bag…</p>
      </main>
    );
  }

  if (detailed.length === 0) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16">
        <h1 className="text-5xl uppercase">Nothing to check out</h1>
        <Link to="/shop" search={shopQuery()} className="btn btn-primary mt-6">
          Back to the shop
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto grid max-w-6xl gap-10 px-4 py-8 lg:grid-cols-12">
      <AccountGate
        className="lg:col-span-7"
        reason="You can look around without an account. Sign up with an email or a South African mobile number before the order is sent."
      >
        <form onSubmit={submit} className="lg:col-span-7" noValidate>
          <h1 className="text-5xl uppercase">Send the order</h1>
          <p className="mt-3 text-sm text-muted">
            Checkout opens WhatsApp to {WHATSAPP_DISPLAY}. Your account can be an email or a mobile. This order still needs a WhatsApp number so we can confirm it. Courier Guy and Aramex are {formatMoney(DELIVERIES[0]?.fee ?? 110)} outside Bloemfontein. Delivery inside Bloemfontein, and collection, are free. Another courier is charged to you and confirmed on WhatsApp.
          </p>

          <fieldset className="mt-8">
            <legend className="text-xs uppercase tracking-widest">How you get it</legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {DELIVERIES.map((option) => (
                <DeliveryChoice
                  key={option.id}
                  checked={form.delivery === option.id}
                  onSelect={() => chooseDelivery(option.id)}
                  title={option.label}
                  detail={option.detail}
                />
              ))}
            </div>
          </fieldset>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Field label="Full name" error={errors.name} className="sm:col-span-2">
              <input className="field" value={form.name} onChange={(e) => update("name", e.target.value)} autoComplete="name" />
            </Field>
            <Field label="WhatsApp phone" error={errors.phone}>
              <input className="field" type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} autoComplete="tel" placeholder="082 000 0000" />
            </Field>
            <Field label="Email (optional)" error={errors.email}>
              <input className="field" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} autoComplete="email" />
            </Field>
          </div>

          {needsAddress ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Street address" error={errors.line1} className="sm:col-span-2">
                <input className="field" value={form.line1} onChange={(e) => update("line1", e.target.value)} autoComplete="address-line1" />
              </Field>
              <Field label="Suburb" error={errors.suburb}>
                <input className="field" value={form.suburb} onChange={(e) => update("suburb", e.target.value)} />
              </Field>
              <Field label="City" error={errors.city}>
                <input className="field" value={form.city} onChange={(e) => update("city", e.target.value)} autoComplete="address-level2" />
              </Field>
              <Field label="Province" error={errors.province}>
                <select className="field" value={form.province} onChange={(e) => update("province", e.target.value)}>
                  {PROVINCES.map((province) => (
                    <option key={province}>{province}</option>
                  ))}
                </select>
              </Field>
              <Field label="Postal code" error={errors.postal}>
                <input className="field" value={form.postal} onChange={(e) => update("postal", e.target.value)} autoComplete="postal-code" />
              </Field>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted">
              Collect at {COLLECTION_ADDRESS}. {COLLECTION_HOURS} We confirm on WhatsApp. No street address needed.
            </p>
          )}

          {form.delivery === "bloem" ? (
            <p className="mt-3 text-sm">
              Free delivery only if the city is Bloemfontein. Johannesburg or any other city is Courier Guy or Aramex at {formatMoney(DELIVERIES[0]?.fee ?? 110)}.
            </p>
          ) : null}
          {form.delivery === "other" ? (
            <p className="mt-4 text-sm">
              Courier Guy and Aramex are the shop couriers. If you want a different company, or your own driver, that cost is charged to you. We confirm it on WhatsApp before anything leaves Brandwag.
            </p>
          ) : null}

          <div className="mt-6">
            <NoReturnNotice />
          </div>

          {anyPrintable ? (
            <section className="mt-8">
              <h2 className="text-2xl uppercase">Printing</h2>
              <p className="mt-2 text-sm text-muted">
                On a shirt or long sleeve you can leave it plain, or add up to 12 letters, 2 numbers, and badges. Custom printing cannot be refunded or returned.
              </p>
              <div className="mt-4 flex flex-col gap-4">
                {detailed.map(({ line, product }) => {
                  if (!product.printable) return null;
                  const offer = lineOffer(line, product);
                  const key = lineKey(line.productId, line.size, line.version ?? "player", offer);
                  const spec = specFor(key);
                  const letters = (spec.name.match(/[A-Za-z]/g) ?? []).length;
                  return (
                    <div key={key} className="border border-line bg-paper p-4">
                      <p className="font-display text-xl uppercase leading-none">{product.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-widest text-muted">
                        Size {line.size} · Qty {line.qty}
                      </p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => setPrint(key, { ...spec, on: false })}
                          className={`min-h-11 border px-3 text-left text-sm ${spec.on ? "border-line bg-bone" : "border-ink bg-ink text-bone"}`}
                        >
                          No printing
                        </button>
                        <button
                          type="button"
                          onClick={() => setPrint(key, { ...spec, on: true })}
                          className={`min-h-11 border px-3 text-left text-sm ${spec.on ? "border-ink bg-ink text-bone" : "border-line bg-bone"}`}
                        >
                          Print this shirt
                        </button>
                      </div>
                      {spec.on ? (
                        <div className="mt-4 grid gap-3">
                          <Field label={`Name · ${letters}/12 letters`} error="">
                            <input
                              className="field"
                              value={spec.name}
                              onChange={(e) => setPrint(key, { ...spec, name: cleanPrintName(e.target.value) })}
                              placeholder="Letters and spaces only"
                              autoComplete="off"
                            />
                          </Field>
                          <Field label={`Number · ${spec.number.length}/2 digits`} error="">
                            <input
                              className="field"
                              inputMode="numeric"
                              value={spec.number}
                              onChange={(e) => setPrint(key, { ...spec, number: cleanPrintNumber(e.target.value) })}
                              placeholder="0–99"
                              autoComplete="off"
                            />
                          </Field>
                          <div>
                            <p className="text-xs uppercase tracking-widest text-muted">Badges</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {PRINT_BADGES.map((badge) => {
                                const on = spec.badges.includes(badge.id);
                                return (
                                  <button
                                    key={badge.id}
                                    type="button"
                                    aria-pressed={on}
                                    onClick={() =>
                                      setPrint(key, {
                                        ...spec,
                                        badges: on ? spec.badges.filter((id) => id !== badge.id) : [...spec.badges, badge.id],
                                      })
                                    }
                                    className={`min-h-11 border px-3 text-sm ${on ? "border-ink bg-ink text-bone" : "border-line bg-bone"}`}
                                  >
                                    {badge.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-muted">This one goes out plain. No name, number, or badge.</p>
                      )}
                      {errors[key] ? <p className="mt-2 text-sm text-danger">{errors[key]}</p> : null}
                    </div>
                  );
                })}
              </div>
              {detailed.some((row) => row.product.printable && specFor(lineKey(row.line.productId, row.line.size, row.line.version ?? "player", lineOffer(row.line, row.product))).on) ? (
                <label className="mt-4 flex items-start gap-3 border border-danger bg-paper px-4 py-4 text-sm">
                  <input type="checkbox" className="mt-1 h-5 w-5" checked={ack} onChange={(e) => setAck(e.target.checked)} />
                  <span>
                    I understand there are no refunds or returns on customised items. This cannot be changed after the order is sent.
                    {errors.ack ? <span className="mt-1 block text-danger">{errors.ack}</span> : null}
                  </span>
                </label>
              ) : null}
            </section>
          ) : null}

          <Field label="Notes" error="" className="mt-4">
            <textarea className="field min-h-28" value={form.notes} onChange={(e) => update("notes", e.target.value)} />
          </Field>

          {errors.bag ? <p className="mt-3 text-sm text-danger">{errors.bag}</p> : null}

          <button type="submit" className="btn btn-primary mt-6 w-full sm:w-auto" disabled={sending}>
            Send on WhatsApp · {formatMoney(total)}
          </button>
          <p className="mt-4 text-sm text-muted">Or pay the same total with PayPal. The order is saved only after PayPal confirms it.</p>
          <PayPalCheckout
            onCollect={collectOrder}
            onError={(message) => setErrors({ bag: message })}
            onPaid={(order) => {
              const payload = collectOrder();
              if (!payload || !order.id) return;
              placeOrder(payload.customer, payload.lines, order.subtotal, order.shipping, order.id);
              pingCatalog();
              void navigate({ to: "/order/$id", params: { id: order.id } });
            }}
          />
        </form>
      </AccountGate>

      <aside className="h-fit border border-line bg-paper p-5 lg:col-span-5">
        <h2 className="text-2xl uppercase">Your bag</h2>
        <ul className="mt-4 flex flex-col gap-4">
          {detailed.map(({ line, product }) => {
            const offer = lineOffer(line, product);
            const spec = specFor(lineKey(line.productId, line.size, line.version ?? "player", offer));
            const summary = product.printable ? describePrint(spec.on ? spec : blankPrint()) : null;
            return (
              <li key={`${line.productId}-${line.size}-${line.version ?? "player"}-${offer}`} className="flex gap-3">
                <img src={product.image} alt="" className="h-20 w-16 object-contain bg-[#0e0e0e]" />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg uppercase leading-none">{product.name}</p>
                  <p className="mt-1 text-xs text-muted">
                    Size {line.size} · Qty {line.qty}
                  </p>
                  {summary ? <p className="mt-1 text-xs text-muted">{summary}</p> : null}
                </div>
                <p className="text-sm tabular-nums">{formatMoney(shirtPrice(product, line.version ?? "player", line.size, offer) * line.qty)}</p>
              </li>
            );
          })}
        </ul>
        <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd className="tabular-nums">{formatMoney(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Delivery</dt>
            <dd className="tabular-nums">{shipping === 0 ? "Free" : formatMoney(shipping)}</dd>
          </div>
          <div className="flex justify-between font-medium">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatMoney(total)}</dd>
          </div>
        </dl>
      </aside>
    </main>
  );
}

function Field({
  label,
  error,
  children,
  className = "",
}: {
  label: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs uppercase tracking-widest text-muted">{label}</span>
      <span className="mt-1 block">{children}</span>
      {error ? <span className="mt-1 block text-sm text-danger">{error}</span> : null}
    </label>
  );
}

function DeliveryChoice({
  checked,
  onSelect,
  title,
  detail,
}: {
  checked: boolean;
  onSelect: () => void;
  title: string;
  detail: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`min-h-11 border px-4 py-3 text-left ${checked ? "border-ink bg-ink text-bone" : "border-line bg-paper"}`}
    >
      <span className="block font-display text-xl uppercase">{title}</span>
      <span className={`mt-1 block text-xs ${checked ? "text-bone/80" : "text-muted"}`}>{detail}</span>
    </button>
  );
}
