import { COLLECTION_ADDRESS, COLLECTION_HOURS, deliveryName, formatMoney, SHOP_NAME, statusLabel } from "@/data/catalog";
import { PRINT_BADGES } from "@/data/size-charts";
import type { Customer, Order, OrderLine, PrintSpec } from "@/lib/store";

export const WHATSAPP_NUMBER = "27711073723";
export const WHATSAPP_DISPLAY = "071 107 3723";

export function whatsAppUrl(text: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export function customerWhatsAppUrl(phone: string, text: string) {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = `27${digits.slice(1)}`;
  else if (digits.length === 9) digits = `27${digits}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

const STATUS_NOTE: Partial<Record<string, string>> = {
  printing: "Your printing is being done. A custom item cannot be refunded or returned.",
  packed: "It is packed and will leave soon.",
  sent: "It is with the courier.",
  ready: `You can collect at ${COLLECTION_ADDRESS}. ${COLLECTION_HOURS}`,
};

export function statusUpdateMessage(
  order: { id: string; customerName: string },
  status: string,
  origin: string,
) {
  const first = order.customerName.trim().split(/\s+/)[0] || "there";
  return [
    `${SHOP_NAME} update ${order.id}`,
    `Hi ${first}, your order is now ${statusLabel(status)}.`,
    STATUS_NOTE[status] ?? "",
    `Track it: ${origin}/track?id=${encodeURIComponent(order.id)}`,
  ]
    .filter((line) => line !== "")
    .join("\n");
}

export function deliveryLabel(delivery: Customer["delivery"] | string) {
  if (delivery === "bloem") return "Delivery in Bloemfontein — free";
  if (delivery === "collection") return `Collect at ${COLLECTION_ADDRESS} — free`;
  if (delivery === "aramex") return "Aramex from Bloemfontein — R110";
  if (delivery === "other") return "Other courier — fee charged to the customer and confirmed on WhatsApp";
  if (delivery === "courier_guy" || delivery === "courier") return "Courier Guy from Bloemfontein — R110";
  return `${deliveryName(delivery)} from Bloemfontein`;
}

export function describePrint(print?: PrintSpec | null) {
  if (!print) return null;
  if (!print.on) return "No printing";
  const badges = PRINT_BADGES.filter((badge) => print.badges.includes(badge.id)).map((badge) => badge.label);
  const bits = [
    print.name ? `Name: ${print.name}` : "",
    print.number ? `Number: ${print.number}` : "",
    badges.length ? `Badges: ${badges.join(", ")}` : "No badges",
  ].filter(Boolean);
  return bits.join(" · ");
}

function printLine(line: OrderLine) {
  return describePrint(line.print) ?? "No printing";
}

export function orderMessage(order: Pick<Order, "id" | "customer" | "lines" | "subtotal" | "shipping" | "total">) {
  const { customer } = order;
  const address =
    customer.delivery === "collection"
      ? `Collect at ${COLLECTION_ADDRESS}. ${COLLECTION_HOURS}`
      : [customer.line1, customer.suburb, customer.city, customer.province, customer.postal].filter(Boolean).join(", ");
  const items = order.lines
    .map((line, index) => {
      return `${index + 1}. ${line.name}\nSize ${line.size} · Qty ${line.qty} · ${formatMoney(line.price * line.qty)}\n${printLine(line)}`;
    })
    .join("\n\n");
  const custom = order.lines.some((line) => line.print?.on);
  return [
    `${SHOP_NAME} order ${order.id}`,
    `Name: ${customer.name}`,
    `Phone: ${customer.phone}`,
    customer.email ? `Email: ${customer.email}` : "",
    deliveryLabel(customer.delivery),
    address,
    "",
    items,
    "",
    `Subtotal: ${formatMoney(order.subtotal)}`,
    `Delivery: ${order.shipping === 0 ? "Free" : formatMoney(order.shipping)}`,
    `Total: ${formatMoney(order.total)}`,
    customer.notes ? `Note: ${customer.notes}` : "",
    customer.delivery === "other" ? "Customer will use their own courier. Confirm the fee on WhatsApp before sending." : "",
    "",
    custom
      ? "CUSTOM PRINTING: no refunds and no returns on these items."
      : "Plain items: a 2–4 cm fit difference is normal and is not a refund. Printed items cannot be returned.",
  ]
    .filter((line) => line !== "")
    .join("\n");
}
