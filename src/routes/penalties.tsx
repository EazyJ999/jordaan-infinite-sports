import { createFileRoute, Link } from "@tanstack/react-router";
import { shopQuery } from "@/data/catalog";

export const Route = createFileRoute("/penalties")({
  head: () => ({ meta: [{ title: "Penalties · J.I.S" }] }),
  component: PenaltiesPage,
});

function PenaltiesPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-xs uppercase tracking-widest text-brass">Mini game</p>
      <h1 className="mt-2 text-5xl uppercase">Penalties</h1>
      <p className="mt-3 max-w-xl text-sm text-muted">
        The penalty game is off for now. The unique-kit draw is not taking entries from it.
      </p>
      <Link to="/shop" search={shopQuery()} className="btn btn-line mt-6">
        Back to the shop
      </Link>
    </main>
  );
}
