import { useEffect, useRef } from "react";

const FEATURES = ["Since 2013", "Authentic replicas", "Custom shirts", "WhatsApp orders", "International teams"];
const PIECES = 8;
const SPEED = 3.05;

function easeOut(p: number) {
  const t = Math.min(1, Math.max(0, p));
  return 1 - (1 - t) ** 3;
}

function easeInOut(p: number) {
  const t = Math.min(1, Math.max(0, p));
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

type Circle = {
  el: HTMLElement;
  x: number;
  y: number;
  r: number;
  inside: boolean;
};

export function BrandStage() {
  const stageRef = useRef<HTMLDivElement>(null);
  const hitRef = useRef<HTMLButtonElement>(null);
  const pieceRefs = useRef<(HTMLImageElement | null)[]>([]);
  const motion = useRef({
    x: 6,
    y: 18,
    vx: SPEED * 0.2,
    vy: -SPEED * 0.98,
    angle: -12,
    spin: 1.4,
    hitEl: null as HTMLElement | null,
    hitUntil: 0,
  });
  const mode = useRef<"bounce" | "burst">("bounce");
  const burst = useRef({ t: 0, fromX: 0, fromY: 0 });

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const spots = Array.from({ length: PIECES }, (_, index) => {
      const angle = (Math.PI * 2 * index) / PIECES + 0.2;
      const dist = 78 + (index % 3) * 26;
      return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, rot: (index - 3.5) * 22 };
    });
    let frame = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(34, now - last) / 16.67;
      last = now;
      frame = requestAnimationFrame(tick);
      const stage = stageRef.current;
      const hit = hitRef.current;
      if (!stage || !hit) return;
      const m = motion.current;
      if (m.hitEl && now > m.hitUntil) {
        m.hitEl.classList.remove("is-hit");
        m.hitEl = null;
      }

      if (mode.current === "bounce") {
        const stageRect = stage.getBoundingClientRect();
        const originX = stageRect.left + stageRect.width / 2;
        const originY = stageRect.top + stageRect.height / 2;
        const logoR = hit.offsetWidth * 0.42;
        const circles: Circle[] = [];
        stage.querySelectorAll<HTMLElement>(".brand-wall, .brand-bumper").forEach((el) => {
          const rect = el.getBoundingClientRect();
          const inside = el.classList.contains("brand-wall");
          let r = rect.width / 2;
          if (inside) r = Math.min(r, Math.min(stageRect.width, stageRect.height) / 2 - 6);
          circles.push({
            el,
            x: rect.left + rect.width / 2 - originX,
            y: rect.top + rect.height / 2 - originY,
            r,
            inside,
          });
        });

        m.x += m.vx * dt;
        m.y += m.vy * dt;
        m.angle += m.spin * dt;

        for (let pass = 0; pass < 3; pass += 1) {
          let best: (Circle & { nx: number; ny: number; limit: number; pen: number }) | null = null;
          for (const circle of circles) {
            const dx = m.x - circle.x;
            const dy = m.y - circle.y;
            const dist = Math.hypot(dx, dy) || 0.0001;
            const nx = dx / dist;
            const ny = dy / dist;
            if (circle.inside) {
              const limit = circle.r - logoR;
              if (limit < 10) continue;
              const pen = dist - limit;
              const headingOut = m.vx * nx + m.vy * ny > 0;
              if (pen > 0 && headingOut && (!best || pen > best.pen)) best = { ...circle, nx, ny, limit, pen };
            } else {
              const limit = circle.r + logoR;
              const pen = limit - dist;
              const headingIn = m.vx * nx + m.vy * ny < 0;
              if (pen > 0 && headingIn && (!best || pen > best.pen)) best = { ...circle, nx, ny, limit, pen };
            }
          }
          if (!best) break;
          const dot = m.vx * best.nx + m.vy * best.ny;
          m.vx -= 2 * dot * best.nx;
          m.vy -= 2 * dot * best.ny;
          const place = best.inside ? best.limit - 1 : best.limit + 1;
          m.x = best.x + best.nx * place;
          m.y = best.y + best.ny * place;
          const graze = -m.vx * best.ny + m.vy * best.nx;
          m.spin = Math.max(-4.8, Math.min(4.8, graze * 1.45));
          if (Math.abs(m.spin) < 1.05) m.spin = graze >= 0 ? 1.6 : -1.6;
          const sp = Math.hypot(m.vx, m.vy) || SPEED;
          m.vx = (m.vx / sp) * SPEED;
          m.vy = (m.vy / sp) * SPEED;
          if (m.hitEl && m.hitEl !== best.el) m.hitEl.classList.remove("is-hit");
          best.el.classList.add("is-hit");
          m.hitEl = best.el;
          m.hitUntil = now + 220;
        }

        hit.style.transform = `translate(calc(-50% + ${m.x}px), calc(-50% + ${m.y}px)) rotate(${m.angle}deg)`;
        return;
      }

      burst.current.t += dt * 16.67;
      const t = burst.current.t;
      const { fromX, fromY } = burst.current;
      pieceRefs.current.forEach((el, index) => {
        if (!el) return;
        const spot = spots[index];
        let x = fromX;
        let y = fromY;
        let scale = 0.85;
        let rot = 0;
        let opacity = 1;
        if (t < 460) {
          const p = easeOut(t / 460);
          x = fromX + spot.x * p;
          y = fromY + spot.y * p;
          scale = 0.72 + 0.28 * p;
          rot = spot.rot * p;
        } else if (t < 1180) {
          const p = easeInOut((t - 460) / 720);
          x = (fromX + spot.x) * (1 - p);
          y = (fromY + spot.y) * (1 - p);
          scale = 1 - p * 0.2;
          rot = spot.rot * (1 - p);
        } else {
          const p = Math.min(1, (t - 1180) / 340);
          x = 0;
          y = 0;
          scale = 0.8 + p * 0.7;
          opacity = 1 - p;
        }
        el.style.opacity = String(opacity);
        el.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${scale}) rotate(${rot}deg)`;
      });

      if (t >= 1120) {
        const p = Math.min(1, (t - 1120) / 420);
        const pop = p < 0.62 ? 0.22 + (p / 0.62) * 0.98 : 1.2 - (p - 0.62) * 0.2;
        hit.style.visibility = "visible";
        hit.style.transform = `translate(-50%, -50%) scale(${pop})`;
      }

      if (t >= 1560) {
        mode.current = "bounce";
        const heading = Math.random() * Math.PI * 2;
        motion.current.x = Math.cos(heading) * 10;
        motion.current.y = Math.sin(heading) * 10;
        motion.current.vx = Math.cos(heading + 0.9) * SPEED;
        motion.current.vy = Math.sin(heading + 0.9) * SPEED;
        motion.current.angle = 0;
        motion.current.spin = heading > Math.PI ? 1.6 : -1.6;
        hit.style.visibility = "";
        hit.style.transform = "translate(-50%, -50%)";
        pieceRefs.current.forEach((el) => {
          if (!el) return;
          el.style.opacity = "0";
        });
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  function burstLogo() {
    if (mode.current !== "bounce") return;
    mode.current = "burst";
    burst.current = { t: 0, fromX: motion.current.x, fromY: motion.current.y };
    if (hitRef.current) hitRef.current.style.visibility = "hidden";
    pieceRefs.current.forEach((el) => {
      if (!el) return;
      el.style.opacity = "1";
      el.style.transform = `translate(calc(-50% + ${motion.current.x}px), calc(-50% + ${motion.current.y}px)) scale(0.72)`;
    });
  }

  return (
    <div className="brand-stage frame-hero" ref={stageRef}>
      <div className="brand-glow" aria-hidden="true">
        <div className="brand-wall" />
        <div className="brand-bumper brand-bumper-a" />
        <div className="brand-bumper brand-bumper-b" />
        <div className="brand-bumper brand-bumper-c" />
      </div>
      <div className="brand-sweep" aria-hidden="true" />
      <div className="brand-ring" aria-hidden="true" />
      <div className="brand-ring brand-ring-b" aria-hidden="true" />
      {Array.from({ length: PIECES }, (_, index) => (
        <img
          key={index}
          ref={(node) => {
            pieceRefs.current[index] = node;
          }}
          src="/brand/logo.png"
          alt=""
          className="brand-piece"
        />
      ))}
      <button ref={hitRef} type="button" className="brand-logo-hit" onClick={burstLogo} aria-label="Burst the Jordaan Infinite Sportswear logo">
        <img src="/brand/logo.png" alt="" className="brand-logo logo-on-light" />
        <img src="/brand/mark-dark.png" alt="" className="brand-logo logo-on-dark" />
      </button>
      <ul className="brand-features" aria-hidden="true">
        {FEATURES.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
    </div>
  );
}
