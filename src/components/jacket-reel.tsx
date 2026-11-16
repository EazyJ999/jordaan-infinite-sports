import { useEffect, useState } from "react";
import { RED_BULL_SHOTS } from "@/data/catalog";

export function JacketReel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % RED_BULL_SHOTS.length);
    }, 2800);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div>
      <div className="relative aspect-[4/5] max-h-96 overflow-hidden bg-[#0e0e0e]">
        {RED_BULL_SHOTS.map((shot, shotIndex) => (
          <img
            key={shot.src}
            src={shot.src}
            alt={shotIndex === index ? shot.alt : ""}
            className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-700 ${shotIndex === index ? "opacity-100" : "opacity-0"}`}
          />
        ))}
      </div>
      <div className="mt-3 flex gap-2" role="tablist" aria-label="Jacket photos">
        {RED_BULL_SHOTS.map((shot, shotIndex) => (
          <button
            key={shot.src}
            type="button"
            aria-label={shot.alt}
            aria-selected={shotIndex === index}
            onClick={() => setIndex(shotIndex)}
            className={`h-2.5 w-2.5 rounded-full ${shotIndex === index ? "bg-pitch" : "bg-line"}`}
          />
        ))}
      </div>
    </div>
  );
}
