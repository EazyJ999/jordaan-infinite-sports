import { chartById, type SizeChartId } from "@/data/size-charts";

export function SizeChartTable({ id }: { id: SizeChartId | string }) {
  const chart = chartById(id);
  return (
    <div>
      <h3 className="text-2xl uppercase">{chart.title}</h3>
      <p className="mt-2 text-sm text-muted">{chart.blurb}</p>
      <div className="mt-4 overflow-x-auto border border-line">
        <table className={`w-full border-collapse text-left text-sm ${chart.columns.length > 6 ? "min-w-[52rem]" : "min-w-[36rem]"}`}>
          <thead>
            <tr className="bg-ink text-bone">
              <th className="px-3 py-3 font-medium">Size</th>
              {chart.columns.map((column) => (
                <th key={column} className="px-3 py-3 font-medium tabular-nums">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chart.rows.map((row, index) => (
              <tr key={row.label} className={index % 2 === 0 ? "bg-paper" : "bg-bone"}>
                <th className="px-3 py-3 font-medium">{row.label}</th>
                {row.values.map((value, cell) => (
                  <td key={`${row.label}-${cell}`} className="px-3 py-3 tabular-nums">
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SizeNote() {
  return (
    <p className="text-sm text-muted">
      Measurements are a guide. A difference of 2–4 cm is normal and is not a reason for a refund. Customised items — any name, number or badge — cannot be refunded or returned.
    </p>
  );
}
