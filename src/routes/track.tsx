import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { COLLECTION_ADDRESS, COLLECTION_HOURS, ORDER_STATUSES, deliveryName, formatMoney, shopQuery, statusLabel } from "@/data/catalog";
import { NoReturnNotice } from "@/components/no-return";
import { describePrint } from "@/lib/whatsapp-order";
import { trackShopOrder, type TrackedOrder } from "@/lib/orders.functions";

export const Route = createFileRoute("/track")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search.id === "string" ? search.id : "",
  }),
  head: () => ({ meta: [{ title: "Track an order · J.I.S" }] }),
  component: TrackPage,
});

function TrackPage() {
  const { id: initialId } = Route.useSearch();
  const [code, setCode] = useState(initialId);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [order, setOrder] = useState<TrackedOrder | null>(null);

  async function lookup(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await trackShopOrder({ data: { id: code, phone } });
      if (!result.ok) {
        setOrder(null);
        setError(result.error);
        return;
      }
      setOrder(result.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not look up that order.");
    } finally {
      setBusy(false);
    }
  }

  const step = order ? ORDER_STATUSES.findIndex((item) => item.id === order.status) : -1;
  const custom = order?.lines.some((line) => line.print?.on) ?? false;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-xs uppercase tracking-widest text-brass">Order tracking</p>
      <h1 className="mt-2 text-5xl uppercase">Where is my order?</h1>
      <p className="mt-3 max-w-xl text-sm text-muted">
        Use the order code from checkout and the same WhatsApp number. The shop updates the status as it is confirmed, printed, packed and sent.
      </p>
      <form onSubmit={(event) => void lookup(event)} className="mt-6 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <input className="field" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Order code" aria-label="Order code" />
        <input className="field" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="WhatsApp number" aria-label="WhatsApp number" inputMode="tel" />
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? "Checking…" : "Track"}
        </button>
      </form>
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}

      {order ? (
        <section className="mt-8 border border-line bg-paper p-5">
          <p className="text-xs uppercase tracking-widest text-muted">{order.id}</p>
          <h2 className="mt-1 text-4xl uppercase">{statusLabel(order.status)}</h2>
          <p className="mt-2 text-sm text-muted">{deliveryName(order.delivery)}</p>
          {order.delivery === "collection" && order.status !== "cancelled" ? (
            <p className="mt-2 text-sm">
              Collect at {COLLECTION_ADDRESS}. {COLLECTION_HOURS}
            </p>
          ) : null}
          {order.status !== "cancelled" ? (
            <ol className="mt-5 grid gap-2 sm:grid-cols-4">
              {ORDER_STATUSES.filter((item) => item.id !== "cancelled").map((item, index) => (
                <li
                  key={item.id}
                  className={`border px-3 py-2 text-xs uppercase tracking-widest ${
                    index <= step && order.status !== "cancelled" ? "border-pitch text-brass" : "border-line text-muted"
                  }`}
                >
                  {item.label}
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-4 text-sm">This order was cancelled. On-hand pieces go back on the shelf.</p>
          )}
          <ul className="mt-5 flex flex-col gap-2 text-sm">
            {order.lines.map((line, index) => (
              <li key={`${line.name}-${line.size}-${index}`}>
                {line.name} · Size {line.size} · Qty {line.qty}
                {describePrint(line.print) ? ` · ${describePrint(line.print)}` : ""}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm tabular-nums">Total {formatMoney(order.total)}</p>
          {custom ? (
            <div className="mt-4">
              <NoReturnNotice />
            </div>
          ) : null}
        </section>
      ) : null}
      <Link to="/shop" search={shopQuery()} className="btn btn-line mt-8">
        Back to the shop
      </Link>
    </main>
  );
}
