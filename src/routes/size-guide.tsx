import { createFileRoute, Link } from "@tanstack/react-router";
import { SizeChartTable, SizeNote } from "@/components/size-chart";
import { shopQuery } from "@/data/catalog";
import { SIZE_CHARTS } from "@/data/size-charts";

export const Route = createFileRoute("/size-guide")({
  head: () => ({ meta: [{ title: "Size guide · J.I.S" }] }),
  component: SizeGuidePage,
});

function SizeGuidePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <p className="text-xs uppercase tracking-widest text-brass">Fit</p>
      <h1 className="mt-2 text-5xl uppercase">Size guide</h1>
      <p className="mt-3 max-w-xl text-sm text-muted">
        Measure a shirt that already fits, then match the length and width. Height and weight are only a starting point.
      </p>
      <div className="mt-4">
        <SizeNote />
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        {SIZE_CHARTS.map((chart) => (
          <a key={chart.id} href={`#${chart.id}`} className="btn btn-line">
            {chart.title}
          </a>
        ))}
      </div>
      <div className="mt-10 flex flex-col gap-12">
        {SIZE_CHARTS.map((chart) => (
          <section key={chart.id} id={chart.id} className="scroll-mt-36">
            <SizeChartTable id={chart.id} />
          </section>
        ))}
      </div>
      <Link to="/shop" search={shopQuery()} className="btn btn-primary mt-10">
        Back to the shop
      </Link>
    </main>
  );
}
