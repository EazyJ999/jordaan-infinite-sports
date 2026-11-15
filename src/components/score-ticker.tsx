import { useEffect, useState } from "react";
import { SCORE_HIGHLIGHTS } from "@/data/weekend";
import { listSportNews } from "@/lib/community.functions";

export function ScoreTicker() {
  const [lines, setLines] = useState<string[]>(SCORE_HIGHLIGHTS);

  useEffect(() => {
    let live = true;
    listSportNews()
      .then((result) => {
        if (!live) return;
        const headlines = result.items.slice(0, 8).map((item) => `${item.source} · ${item.title}`);
        const next = [...SCORE_HIGHLIGHTS, ...headlines];
        if (next.length > 0) setLines(next);
      })
      .catch(() => {
        /* keep the score highlights */
      });
    return () => {
      live = false;
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
