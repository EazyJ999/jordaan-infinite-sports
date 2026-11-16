import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Product } from "@/data/catalog";
import { catalogVersion, listPublicProducts } from "@/lib/catalog.functions";

type CatalogValue = {
  products: Product[];
  version: string;
};

const CatalogContext = createContext<CatalogValue | null>(null);
const CHANNEL = "grounds-catalog";

export function pingCatalog() {
  if (typeof BroadcastChannel === "undefined") return;
  const channel = new BroadcastChannel(CHANNEL);
  channel.postMessage("changed");
  channel.close();
}

export function CatalogProvider({
  initial,
  version,
  children,
}: {
  initial: Product[];
  version: string;
  children: ReactNode;
}) {
  const [products, setProducts] = useState(initial);
  const versionRef = useRef(version);

  useEffect(() => {
    if (version === versionRef.current) return;
    versionRef.current = version;
    setProducts(initial);
  }, [initial, version]);

  useEffect(() => {
    let stop = false;
    async function pull() {
      try {
        const next = await catalogVersion();
        if (stop || next === versionRef.current) return;
        const data = await listPublicProducts();
        if (stop) return;
        versionRef.current = data.version;
        setProducts(data.products);
      } catch {
        // Keep the rail that's already on screen.
      }
    }
    const channel = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(CHANNEL);
    channel?.addEventListener("message", () => void pull());
    const onVisible = () => {
      if (!document.hidden) void pull();
    };
    document.addEventListener("visibilitychange", onVisible);
    const id = window.setInterval(() => {
      if (!document.hidden) void pull();
    }, 3000);
    return () => {
      stop = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      channel?.close();
    };
  }, []);

  return <CatalogContext.Provider value={{ products, version: versionRef.current }}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const value = useContext(CatalogContext);
  if (!value) throw new Error("Catalog is not ready");
  return value;
}
