import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Delivery, Offer, ShirtVersion } from "@/data/catalog";

export type PrintSpec = {
  on: boolean;
  name: string;
  number: string;
  badges: string[];
};

export type CartLine = {
  productId: string;
  size: string;
  qty: number;
  version?: ShirtVersion;
  offer?: Offer;
};

export type Account = {
  id: string;
  name: string;
  email: string;
  phone: string;
  over18: boolean;
};

export type Customer = {
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

export type OrderLine = {
  productId: string;
  name: string;
  team: string;
  size: string;
  qty: number;
  price: number;
  version?: ShirtVersion;
  offer?: Offer;
  image: string;
  print?: PrintSpec;
  availability?: "on_hand" | "to_order";
};

export type Order = {
  id: string;
  createdAt: string;
  lines: OrderLine[];
  customer: Customer;
  subtotal: number;
  shipping: number;
  total: number;
};

type ShopState = {
  lines: CartLine[];
  orders: Order[];
  account: Account | null;
  open: boolean;
  setOpen: (open: boolean) => void;
  setAccount: (account: Account | null) => void;
  add: (productId: string, size: string, qty?: number, version?: ShirtVersion, offer?: Offer) => void;
  setQty: (productId: string, size: string, qty: number, version?: ShirtVersion, offer?: Offer) => void;
  remove: (productId: string, size: string, version?: ShirtVersion, offer?: Offer) => void;
  placeOrder: (customer: Customer, priced: OrderLine[], subtotal: number, shipping: number, id?: string) => string;
};

export const useShop = create<ShopState>()(
  persist(
    (set, get) => ({
      lines: [],
      orders: [],
      account: null,
      open: false,
      setOpen: (open) => set({ open }),
      setAccount: (account) => set({ account }),
      add: (productId, size, qty = 1, version = "player", offer = "single") => {
        const lines = get().lines.slice();
        const found = lines.findIndex(
          (l) => l.productId === productId && l.size === size && (l.version ?? "player") === version && (l.offer ?? "single") === offer,
        );
        if (found >= 0) {
          const current = lines[found];
          if (current) lines[found] = { ...current, qty: current.qty + qty };
        } else {
          lines.push({ productId, size, qty, version, offer });
        }
        set({ lines, open: true });
      },
      setQty: (productId, size, qty, version = "player", offer = "single") => {
        set({
          lines: get()
            .lines.map((l) =>
              l.productId === productId && l.size === size && (l.version ?? "player") === version && (l.offer ?? "single") === offer
                ? { ...l, qty }
                : l,
            )
            .filter((l) => l.qty > 0),
        });
      },
      remove: (productId, size, version = "player", offer = "single") => {
        set({
          lines: get().lines.filter(
            (l) => !(l.productId === productId && l.size === size && (l.version ?? "player") === version && (l.offer ?? "single") === offer),
          ),
        });
      },
      placeOrder: (customer, priced, subtotal, shipping, id = `JIS-${Date.now().toString(36).toUpperCase()}`) => {
        const order: Order = {
          id,
          createdAt: new Date().toISOString(),
          lines: priced,
          customer,
          subtotal,
          shipping,
          total: subtotal + shipping,
        };
        set({ orders: [order, ...get().orders], lines: [], open: false });
        return id;
      },
    }),
    {
      name: "grounds-shop",
      partialize: (s) => ({ lines: s.lines, orders: s.orders, account: s.account }),
    },
  ),
);

export function cartCount(lines: CartLine[]) {
  return lines.reduce((sum, line) => sum + line.qty, 0);
}
