import { useEffect, useState } from "react";
import { SHOP_FULL } from "@/data/catalog";

const QR_DARK = "#0e0e0e";
const QR_LIGHT = "#f4f4ef";

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("logo"));
    image.src = src;
  });
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export function SiteQr({ caption }: { caption?: string }) {
  const [src, setSrc] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => {
    const origin = window.location.origin;
    setUrl(origin);
    let stop = false;

    void (async () => {
      const QR = (await import("qrcode")).default;
      const canvas = document.createElement("canvas");
      await QR.toCanvas(canvas, origin, {
        errorCorrectionLevel: "H",
        margin: 2,
        width: 480,
        color: { dark: QR_DARK, light: QR_LIGHT },
      });
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      try {
        const bunny = await loadImage("/brand/logo.png");
        const size = canvas.width;
        const side = Math.round(size * 0.3);
        const tile = document.createElement("canvas");
        tile.width = side;
        tile.height = side;
        const tctx = tile.getContext("2d");
        if (tctx) {
          tctx.fillStyle = QR_DARK;
          tctx.fillRect(0, 0, side, side);
          const inner = side * 0.88;
          const scale = inner / Math.max(bunny.width, bunny.height);
          const nw = bunny.width * scale;
          const nh = bunny.height * scale;
          tctx.imageSmoothingEnabled = true;
          tctx.imageSmoothingQuality = "high";
          tctx.drawImage(bunny, (side - nw) / 2, (side - nh) / 2, nw, nh);
          const halo = side + Math.round(size * 0.018) * 2;
          const hx = (size - halo) / 2;
          const hy = (size - halo) / 2;
          ctx.fillStyle = QR_LIGHT;
          roundedRect(ctx, hx, hy, halo, halo, halo / 8);
          ctx.fill();
          ctx.save();
          roundedRect(ctx, (size - side) / 2, (size - side) / 2, side, side, side / 8);
          ctx.clip();
          ctx.drawImage(tile, (size - side) / 2, (size - side) / 2);
          ctx.restore();
        }
      } catch {
        // The plain code still opens the shop if the mark cannot load.
      }
      if (!stop) setSrc(canvas.toDataURL("image/png"));
    })();

    return () => {
      stop = true;
    };
  }, []);

  return (
    <div className="grid w-full max-w-xl grid-cols-[11rem_minmax(0,1fr)] items-center gap-x-4 gap-y-3">
      {src ? (
        <img src={src} alt={`QR code that opens ${SHOP_FULL}`} width={176} height={176} className="h-44 w-44 bg-ink" />
      ) : (
        <div className="h-44 w-44 bg-ink" aria-hidden />
      )}
      <div>
        <p className="text-xs uppercase tracking-widest text-brass">Shop QR</p>
        <p className="mt-1 text-sm">{caption ?? `Scan to open ${SHOP_FULL}.`}</p>
        {url ? <p className="mt-1 break-all text-xs text-muted">{url.replace(/^https?:\/\//, "")}</p> : null}
      </div>
    </div>
  );
}
