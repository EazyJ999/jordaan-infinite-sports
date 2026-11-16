import { Link } from "@tanstack/react-router";
import * as Dialog from "@radix-ui/react-dialog";
import { Minus, Plus, X } from "lucide-react";
import { formatMoney, lineOffer, shirtPrice } from "@/data/catalog";
import { cartCount, useShop } from "@/lib/store";
import { useHydrated } from "@/lib/use-hydrated";
import { useCatalog } from "@/lib/catalog-context";

export function CartDrawer() {
  const hydrated = useHydrated();
  const open = useShop((s) => s.open);
  const setOpen = useShop((s) => s.setOpen);
  const lines = useShop((s) => s.lines);
  const setQty = useShop((s) => s.setQty);
  const remove = useShop((s) => s.remove);

  const { products } = useCatalog();

  const detailed = lines
    .map((line) => {
      const product = products.find((item) => item.slug === line.productId);
      return product ? { line, product } : null;
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  const subtotal = detailed.reduce((sum, row) => {
    const offer = lineOffer(row.line, row.product);
    return sum + shirtPrice(row.product, row.line.version ?? "player", row.line.size, offer) * row.line.qty;
  }, 0);

  return (
    <Dialog.Root open={hydrated && open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/40" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-bone shadow-none outline-none">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <Dialog.Title className="font-display text-2xl uppercase tracking-wide">
              Bag {hydrated ? `(${cartCount(lines)})` : ""}
            </Dialog.Title>
            <Dialog.Close className="inline-flex h-11 w-11 items-center justify-center" aria-label="Close bag">
              <X />
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {detailed.length === 0 ? (
              <p className="text-muted">Your bag is empty. The rail is full of kits.</p>
            ) : (
              <ul className="flex flex-col gap-5">
                {detailed.map(({ line, product }) => {
                  const offer = lineOffer(line, product);
                  return (
                  <li key={`${line.productId}-${line.size}-${line.version ?? "player"}-${offer}`} className="flex gap-3">
                    <img
                      src={product.image}
                      alt=""
                      className="h-28 w-20 object-contain bg-[#0e0e0e]"
                    />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <p className="text-xs text-muted">{product.team}</p>
                      <p className="font-display text-xl leading-none">{product.name}</p>
                      <p className="mt-1 text-sm text-muted">Size {line.size}</p>
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <div className="flex items-center border border-line">
                          <button
                            type="button"
                            className="inline-flex h-11 w-11 items-center justify-center"
                            aria-label="Decrease quantity"
                            onClick={() => setQty(line.productId, line.size, line.qty - 1, line.version ?? "player", offer)}
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-6 text-center text-sm tabular-nums">{line.qty}</span>
                          <button
                            type="button"
                            className="inline-flex h-11 w-11 items-center justify-center"
                            aria-label="Increase quantity"
                            onClick={() =>
                              setQty(
                                line.productId,
                                line.size,
                                Math.min(line.qty + 1, offer === "stock" ? Math.max(product.stock, 1) : 6),
                                line.version ?? "player",
                                offer,
                              )
                            }
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="text-sm tabular-nums">
                            {formatMoney(shirtPrice(product, line.version ?? "player", line.size, offer) * line.qty)}
                          </p>
                          <button
                            type="button"
                            className="text-xs uppercase tracking-widest text-muted underline"
                            onClick={() => remove(line.productId, line.size, line.version ?? "player", offer)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className="border-t border-line px-5 py-4">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="text-muted">Subtotal</span>
              <span className="tabular-nums">{formatMoney(subtotal)}</span>
            </div>
            <p className="mb-3 text-xs text-muted">
              Courier Guy or Aramex is R110 outside Bloemfontein. Delivery is free only in Bloemfontein, and collection at 6 Nobel Street, Brandwag is free. Printing is chosen at checkout. Customised items cannot be returned.
            </p>
            <Link
              to="/checkout"
              onClick={() => setOpen(false)}
              className="btn btn-primary w-full"
              aria-disabled={detailed.length === 0}
              tabIndex={detailed.length === 0 ? -1 : 0}
            >
              Checkout
            </Link>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
