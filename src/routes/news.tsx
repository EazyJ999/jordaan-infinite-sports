import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listSportNews, type NewsItem } from "@/lib/community.functions";

export const Route = createFileRoute("/news")({
  head: () => ({ meta: [{ title: "Daily news · J.I.S" }] }),
  component: NewsPage,
});

function NewsPage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [updatedAt, setUpdatedAt] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    listSportNews()
      .then((result) => {
        if (!live) return;
        setItems(result.items);
        setUpdatedAt(result.updatedAt);
        if (result.items.length === 0) setError("The sports wires are quiet right now. Check again in a little while.");
      })
      .catch(() => {
        if (live) setError("Could not load the sports wires.");
      });
    return () => {
      live = false;
    };
  }, []);

  const when = updatedAt
    ? new Date(updatedAt).toLocaleString("en-ZA", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })
    : "";

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <p className="text-xs uppercase tracking-widest text-brass">Daily news</p>
      <h1 className="mt-2 text-5xl uppercase">Sport around the world</h1>
      <p className="mt-3 max-w-xl text-sm text-muted">
        Headlines from BBC Sport, ESPN, Sky Sports, The Guardian and News24. The list refreshes every hour. The bar at the top also carries yesterday’s and today’s results. Open a story on the site it came from.
      </p>
      {when ? <p className="mt-2 text-xs uppercase tracking-widest text-muted">Updated {when}</p> : null}
      {!error && items.length === 0 ? <p className="mt-6 text-sm text-muted">Loading headlines…</p> : null}
      {error ? <p className="mt-6 text-sm text-muted">{error}</p> : null}
      <ul className="mt-6 divide-y divide-line border-y border-line">
        {items.map((item) => (
          <li key={item.link}>
            <a href={item.link} target="_blank" rel="noreferrer" className="block py-4 hover:text-brass">
              <span className="text-xs uppercase tracking-widest text-brass">{item.source}</span>
              <span className="mt-1 block text-lg">{item.title}</span>
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
