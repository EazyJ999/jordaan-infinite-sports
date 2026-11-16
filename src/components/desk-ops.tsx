import { useEffect, useState } from "react";
import { SEASON_YEARS, deliveryName, formatMoney, seasonCode, seasonText, statusLabel, ORDER_STATUSES, type OrderStatus } from "@/data/catalog";
import { pingCatalog } from "@/lib/catalog-context";
import { customerWhatsAppUrl, describePrint, statusUpdateMessage, whatsAppUrl } from "@/lib/whatsapp-order";
import {
  listBulkEnquiries,
  listDeskOrders,
  setBulkStatus,
  setOrderStatus,
  setStock,
  type BulkEnquiry,
  type DeskOrder,
} from "@/lib/orders.functions";
import type { AdminProduct } from "@/lib/catalog.functions";

export function DeskOps({
  tab,
  products,
  onChanged,
}: {
  tab: "orders" | "stock" | "bulk";
  products: AdminProduct[];
  onChanged: () => void;
}) {
  const [orders, setOrders] = useState<DeskOrder[]>([]);
  const [enquiries, setEnquiries] = useState<BulkEnquiry[]>([]);
  const [error, setError] = useState("");
  const [stockDraft, setStockDraft] = useState<Record<string, string>>({});
  const [seasonDraft, setSeasonDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    let stop = false;
    if (tab === "orders") {
      listDeskOrders()
        .then((result) => {
          if (stop) return;
          if (!result.ok) setError(result.error);
          else setOrders(result.orders);
        })
        .catch(() => {
          if (!stop) setError("Could not load orders.");
        });
    }
    if (tab === "bulk") {
      listBulkEnquiries()
        .then((result) => {
          if (stop) return;
          if (!result.ok) setError(result.error);
          else setEnquiries(result.enquiries);
        })
        .catch(() => {
          if (!stop) setError("Could not load enquiries.");
        });
    }
    return () => {
      stop = true;
    };
  }, [tab]);

  async function changeStatus(id: string, status: OrderStatus, phone: string, customerName: string) {
    setError("");
    const tellCustomer = status === "printing" || status === "packed" || status === "ready" || status === "sent";
    const popup = tellCustomer ? window.open("about:blank", "_blank") : null;
    const result = await setOrderStatus({ data: { id, status } });
    if (!result.ok) {
      popup?.close();
      setError(result.error);
      return;
    }
    setOrders((current) => current.map((order) => (order.id === id ? { ...order, status } : order)));
    if (popup) {
      popup.location.href = customerWhatsAppUrl(phone, statusUpdateMessage({ id, customerName }, status, window.location.origin));
    }
    if (status === "cancelled") onChanged();
  }

  async function saveStock(slug: string) {
    setError("");
    const stock = Number(stockDraft[slug]);
    const season = seasonDraft[slug] ?? products.find((item) => item.slug === slug)?.season ?? "";
    const result = await setStock({ data: { slug, stock, season } });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    pingCatalog();
    onChanged();
  }

  return (
    <div className="mt-8">
      {error ? <p className="mb-4 text-sm text-danger">{error}</p> : null}
      {tab === "orders" ? (
        <ul className="flex flex-col gap-3">
          {orders.length === 0 ? <li className="text-sm text-muted">No orders yet. They show here after a customer checks out.</li> : null}
          {orders.map((order) => (
            <li key={order.id} className="border border-line bg-paper p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-2xl uppercase leading-none">{order.id}</p>
                  <p className="mt-1 text-sm">
                    {order.customerName} · {order.phone}
                    {order.city ? ` · ${order.city}` : ""}
                  </p>
                  <p className="text-xs uppercase tracking-widest text-muted">
                    {deliveryName(order.delivery)} · {formatMoney(order.total)}
                  </p>
                </div>
                <label className="text-xs uppercase tracking-widest text-muted">
                  Status
                  <select
                    className="field mt-1"
                    value={order.status}
                    onChange={(event) => void changeStatus(order.id, event.target.value as OrderStatus, order.phone, order.customerName)}
                  >
                    {ORDER_STATUSES.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <ul className="mt-3 text-sm text-muted">
                {order.lines.map((line, index) => (
                  <li key={`${order.id}-${index}`}>
                    {line.qty} × {line.name} · {line.size}
                    {describePrint(line.print) ? ` · ${describePrint(line.print)}` : ""}
                  </li>
                ))}
              </ul>
              {order.notes ? <p className="mt-2 text-sm">Note: {order.notes}</p> : null}
              <p className="mt-2 text-xs text-muted">Now: {statusLabel(order.status)}. Cancelling puts on-hand pieces back. Changing it again does not take them off a second time.</p>
              <a
                className="btn btn-primary mt-3"
                href={customerWhatsAppUrl(
                  order.phone,
                  statusUpdateMessage(order, order.status, typeof window === "undefined" ? "" : window.location.origin),
                )}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp this update
              </a>
            </li>
          ))}
        </ul>
      ) : null}
      {tab === "stock" ? (
        <div className="overflow-x-auto border border-line">
          <table className="w-full min-w-[48rem] text-left text-sm">
            <thead className="bg-paper text-xs uppercase tracking-widest text-muted">
              <tr>
                <th className="px-3 py-3 font-medium">Kit</th>
                <th className="px-3 py-3 font-medium">Shelf</th>
                <th className="px-3 py-3 font-medium">Year</th>
                <th className="px-3 py-3 font-medium">On hand</th>
                <th className="px-3 py-3 font-medium">Set</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const low = product.availability === "on_hand" && product.stock <= 3;
                return (
                  <tr key={product.slug} className="border-t border-line">
                    <td className="px-3 py-3">
                      <span className="block">{product.name}</span>
                      <span className="text-xs text-muted">{product.hidden ? "Hidden" : product.team}</span>
                    </td>
                    <td className="px-3 py-3">{product.availability === "on_hand" ? "On hand" : "To order"}</td>
                    <td className="px-3 py-3">
                      <select
                        className="field"
                        value={seasonDraft[product.slug] ?? product.season}
                        aria-label={`Year for ${product.name}`}
                        onChange={(event) =>
                          setSeasonDraft((current) => ({ ...current, [product.slug]: event.target.value }))
                        }
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
                    </td>
                    <td className={`px-3 py-3 tabular-nums ${low ? "text-danger" : ""}`}>{product.stock}</td>
                    <td className="px-3 py-3">
                      <div className="flex gap-2">
                        <input
                          className="field w-24"
                          inputMode="numeric"
                          value={stockDraft[product.slug] ?? String(product.stock)}
                          onChange={(event) =>
                            setStockDraft((current) => ({
                              ...current,
                              [product.slug]: event.target.value.replace(/[^\d]/g, ""),
                            }))
                          }
                          aria-label={`Stock for ${product.name}`}
                        />
                        <button type="button" className="btn btn-line" onClick={() => void saveStock(product.slug)}>
                          Save
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
      {tab === "bulk" ? (
        <ul className="flex flex-col gap-3">
          {enquiries.length === 0 ? <li className="text-sm text-muted">No bulk enquiries yet.</li> : null}
          {enquiries.map((item) => (
            <li key={item.id} className="border border-line bg-paper p-4">
              <p className="font-display text-2xl uppercase leading-none">{item.organisation || item.name}</p>
              <p className="mt-1 text-sm">
                {item.name} · {item.phone}
                {item.email ? ` · ${item.email}` : ""}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm">{item.details}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a className="btn btn-primary" href={whatsAppUrl(`${item.name}\n${item.phone}\n${item.details}`)}>
                  WhatsApp
                </a>
                <button
                  type="button"
                  className="btn btn-line"
                  onClick={() =>
                    void setBulkStatus({ data: { id: item.id, status: item.status === "new" ? "contacted" : "new" } }).then(() =>
                      setEnquiries((current) =>
                        current.map((row) =>
                          row.id === item.id ? { ...row, status: row.status === "new" ? "contacted" : "new" } : row,
                        ),
                      ),
                    )
                  }
                >
                  {item.status === "new" ? "Mark contacted" : "Mark new"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
