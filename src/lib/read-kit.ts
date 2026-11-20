import { teamFromText } from "@/data/kit-identity";

export type PhotoRead = {
  team: string;
  colour: string;
  garment: "Shorts" | "Long sleeve" | "Short sleeve";
};

let workerPromise: Promise<Awaited<ReturnType<(typeof import("tesseract.js"))["createWorker"]>>> | null = null;

function colourName(r: number, g: number, b: number) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max === 0 ? 0 : (max - min) / max;
  const lum = 0.3 * r + 0.59 * g + 0.11 * b;
  if (sat < 0.14) {
    if (lum > 185) return "White";
    if (lum < 70) return "Black";
    return "Grey";
  }
  if (g > r + 25 && g > b && lum > 150) return "Mint";
  if (r > 90 && g > 80 && b < 80 && r - b > 40 && Math.abs(r - g) < 50) return "Yellow";
  if (r > 110 && g < 70 && b < 80) return lum < 90 ? "Maroon" : "Red";
  if (b > r && b > g && lum > 150) return "Light blue";
  if (b > r + 15 && b >= g) return "Navy";
  if (g > r && g > b) return "Green";
  if (r > g && r > b) return "Red";
  if (b > r && b > g) return "Blue";
  return "See photo";
}

/** Colour and cut from the photo, then the team printed on the shirt. */
export async function readKitPhoto(file: File): Promise<PhotoRead> {
  const bitmap = await createImageBitmap(file);
  const width = 96;
  const height = Math.max(96, Math.round((96 * bitmap.height) / bitmap.width));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    bitmap.close();
    return { team: "", colour: "See photo", garment: "Short sleeve" };
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const pixels = ctx.getImageData(0, 0, width, height).data;
  let top = height;
  let bottom = 0;
  let wideBottom = 0;
  let red = 0;
  let green = 0;
  let blue = 0;
  let count = 0;
  const x0 = Math.floor(width * 0.3);
  const x1 = Math.floor(width * 0.7);
  const y0 = Math.floor(height * 0.22);
  const y1 = Math.floor(height * 0.72);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = pixels[i] ?? 0;
      const g = pixels[i + 1] ?? 0;
      const b = pixels[i + 2] ?? 0;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const sat = max === 0 ? 0 : (max - min) / max;
      const lum = 0.3 * r + 0.59 * g + 0.11 * b;
      const background = lum > 40 && lum < 95 && sat < 0.18;
      if (!background) {
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        if (y > height * 0.72 && (x < width * 0.18 || x > width * 0.82)) wideBottom += 1;
      }
      if (x >= x0 && x <= x1 && y >= y0 && y <= y1 && !background) {
        red += r;
        green += g;
        blue += b;
        count += 1;
      }
    }
  }
  const colour = count > 8 ? colourName(red / count, green / count, blue / count) : "See photo";
  const fill = bottom > top ? (bottom - top) / height : 1;
  const garment = fill < 0.58 ? "Shorts" : wideBottom > 12 ? "Long sleeve" : "Short sleeve";

  let team = teamFromText(file.name);
  try {
    const { createWorker } = await import("tesseract.js");
    workerPromise ??= createWorker("eng");
    const worker = await workerPromise;
    const read = await worker.recognize(file);
    team = teamFromText(read.data.text) || team;
  } catch {
    // A failed read must not invent a team or keep the photo file name.
  }
  return { team, colour, garment };
}
