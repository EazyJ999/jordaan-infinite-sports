import { createFileRoute, Link } from "@tanstack/react-router";
import { formatMoney, COLLECTION_ADDRESS, COLLECTION_HOURS, deliveryName, shopQuery } from "@/data/catalog";
import { NoReturnNotice } from "@/components/no-return";
import { SiteQr } from "@/components/site-qr";
import { useShop } from "@/lib/store";
import { useHydrated } from "@/lib/use-hydrated";
import { describePrint, orderMessage, whatsAppUrl, WHATSAPP_DISPLAY } from "@/lib/whatsapp-order";

export const Route = createFileRoute("/order/$id")({
  head: ({ params }) => ({
    meta: [{ title: `Order ${params.id} · J.I.S` }],
  }),
  component: OrderPage,
});

function OrderPage() {
  const { id } = Route.useParams();
  const hydrated = useHydrated();
  const order = useShop((s) => s.orders.find((item) => item.id === id));

  if (!hydrated) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <p className="text-muted">Opening the order…</p>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-5xl uppercase">Order not on this device</h1>
        <p className="mt-3 text-muted">
          Orders stay in this browser. If you placed it on another phone, it will be listed there.
        </p>
        <Link to="/orders" className="btn btn-line mt-6">
          Your orders
        </Link>
      </main>
    );
  }

  const when = new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(order.createdAt));

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-xs uppercase tracking-widest text-brass">Order received</p>
      <h1 className="mt-2 text-5xl uppercase">{order.id}</h1>
      <p className="mt-2 text-sm text-muted">{when}</p>
      <p className="mt-4 max-w-xl">
        Thanks, {order.customer.name.split(" ")[0]}. Status starts at Received. Track it with this code and your WhatsApp number. If WhatsApp did not open, send the order again. The shop number is {WHATSAPP_DISPLAY}.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <a href={whatsAppUrl(orderMessage(order))} target="_blank" rel="noreferrer" className="btn btn-primary">
          Open WhatsApp
        </a>
        <Link to="/track" search={{ id: order.id }} className="btn btn-line">
          Track this order
        </Link>
      </div>

      <section className="mt-8 border border-line bg-paper p-5">
        <h2 className="text-2xl uppercase">{deliveryName(order.customer.delivery)}</h2>
        <p className="mt-2 text-sm">
          {order.customer.delivery === "collection"
            ? `Collect at ${COLLECTION_ADDRESS}. ${COLLECTION_HOURS}`
            : order.customer.delivery === "bloem"
              ? `Free delivery in Bloemfontein to ${order.customer.line1}, ${order.customer.suburb}, ${order.customer.city}.`
              : order.customer.delivery === "other"
                ? `Your own courier. The fee is charged to you and confirmed on WhatsApp. Address: ${order.customer.line1}, ${order.customer.suburb}, ${order.customer.city}.`
                : `Courier from Bloemfontein to ${order.customer.line1}, ${order.customer.suburb}, ${order.customer.city}, ${order.customer.province} ${order.customer.postal}.`}
        </p>
        {order.lines.some((line) => line.print?.on) ? (
          <div className="mt-4">
            <NoReturnNotice />
          </div>
        ) : (
          <p className="mt-3 text-sm">A fit difference of 2–4 cm is normal and is not a reason for a return.</p>
        )}
        {order.customer.notes ? (
          <p className="mt-3 text-sm">
            <span className="text-muted">Note: </span>
            {order.customer.notes}
          </p>
        ) : null}
      </section>

      <ul className="mt-6 flex flex-col gap-4">
        {order.lines.map((line) => (
          <li key={`${line.productId}-${line.size}`} className="flex gap-3">
            <img src={line.image} alt="" className="h-20 w-16 object-contain bg-[#0e0e0e]" />
            <div className="flex-1">
              <p className="font-display text-xl uppercase leading-none">{line.name}</p>
              <p className="mt-1 text-xs text-muted">
                {line.team} · Size {line.size} · Qty {line.qty}
                {describePrint(line.print) ? ` · ${describePrint(line.print)}` : ""}
              </p>
            </div>
            <p className="text-sm tabular-nums">{formatMoney(line.price * line.qty)}</p>
          </li>
        ))}
      </ul>
      <dl className="mt-4 space-y-1 border-t border-line pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted">Subtotal</dt>
          <dd className="tabular-nums">{formatMoney(order.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Delivery</dt>
          <dd className="tabular-nums">{order.shipping === 0 ? "Free" : formatMoney(order.shipping)}</dd>
        </div>
        <div className="flex justify-between font-medium">
          <dt>Total</dt>
          <dd className="tabular-nums">{formatMoney(order.total)}</dd>
        </div>
      </dl>
      <div className="mt-8 border border-line bg-paper p-5">
        <SiteQr caption="Scan to come back to Jordaan Infinite Sports." />
      </div>
      <Link to="/shop" search={shopQuery()} className="btn btn-line mt-8">
        Keep browsing
      </Link>
    </main>
  );
}
