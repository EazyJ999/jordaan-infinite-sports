import { createFileRoute, Link } from "@tanstack/react-router";
import { deliveryName, formatMoney, shopQuery } from "@/data/catalog";
import { useShop } from "@/lib/store";
import { useHydrated } from "@/lib/use-hydrated";

export const Route = createFileRoute("/orders")({
  head: () => ({ meta: [{ title: "Your orders · J.I.S" }] }),
  component: OrdersPage,
});

function OrdersPage() {
  const hydrated = useHydrated();
  const orders = useShop((s) => s.orders);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-5xl uppercase">Your orders</h1>
      <p className="mt-3 text-sm text-muted">
        Saved on this phone. Track any order with the code and the WhatsApp number you used at checkout.
      </p>
      {!hydrated ? <p className="mt-8 text-muted">Loading…</p> : null}
      {hydrated && orders.length === 0 ? (
        <div className="mt-8">
          <p>No orders yet.</p>
          <Link to="/shop" search={shopQuery()} className="btn btn-primary mt-5">
            Browse kits
          </Link>
        </div>
      ) : null}
      {hydrated ? (
        <ul className="mt-8 flex flex-col gap-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                to="/order/$id"
                params={{ id: order.id }}
                className="flex items-center justify-between gap-4 border border-line bg-paper px-4 py-4"
              >
                <span>
                  <span className="block font-display text-2xl uppercase">{order.id}</span>
                  <span className="text-xs uppercase tracking-widest text-muted">
                    {order.lines.length} {order.lines.length === 1 ? "piece" : "pieces"} · {deliveryName(order.customer.delivery)}
                  </span>
                </span>
                <span className="tabular-nums">{formatMoney(order.total)}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  );
}
