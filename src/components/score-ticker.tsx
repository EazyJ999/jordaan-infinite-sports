import { useEffect, useState } from "react";
import { listDailyBoard, listSportNews } from "@/lib/community.functions";

const HALF_HOUR = 30 * 60 * 1000;

export function ScoreTicker() {
  const [lines, setLines] = useState<string[]>(["Sport news and results refresh through the day"]);

  useEffect(() => {
    let live = true;

    async function load() {
      const [news, board] = await Promise.all([
        listSportNews().catch(() => null),
        listDailyBoard().catch(() => null),
      ]);
      if (!live) return;
      const results = board?.results.slice(0, 8) ?? [];
      const headlines = news?.items.slice(0, 8).map((item) => `${item.source} · ${item.title}`) ?? [];
      const next = [...results, ...headlines];
      if (next.length > 0) setLines(next);
    }

    void load();
    const timer = window.setInterval(() => void load(), HALF_HOUR);
    return () => {
      live = false;
      window.clearInterval(timer);
    };
  }, []);

  const loop = [...lines, ...lines];

  return (
    <div className="score-ticker" role="region" aria-label="Sport news and scores">
      <p className="sr-only">{lines.join(". ")}</p>
      <div className="score-ticker-mask" aria-hidden="true">
        <div className="score-ticker-track">
          {loop.map((line, index) => (
            <span key={`${line}-${index}`} className="score-ticker-item">
              {line}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
