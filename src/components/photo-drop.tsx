import { useState } from "react";
import { CATEGORIES, SEASON_YEARS, categoryLabel, listPrice, seasonCode, seasonText, seasonYear, type Availability, type Category } from "@/data/catalog";
import { collectionTitle, isCollectionLabel, isSameKit, kitTitle, looksLikeFileName, teamFromText } from "@/data/kit-identity";
import { chartAllowsPrint, chartForCategory } from "@/data/size-charts";
import { saveProduct, listPublicProducts } from "@/lib/catalog.functions";
import { readKitPhoto } from "@/lib/read-kit";

type Batch = {
  key: string;
  name: string;
  team: string;
  season: string;
  collection: string;
  colour: string;
  garment: string;
  files: File[];
};

const ANGLE =
  /^(front|back|side|sides|angle|sleeve|label|detail|rear|left|right|close|closeup|zoom|alt|view|inside|collar|pocket|main)$/i;

function titleCase(value: string) {
  const words = value.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  if (!words) return "";
  return words.replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function stemOf(filename: string) {
  return filename
    .replace(/\.[^.]+$/, "")
    .replace(/\s*\(\d+\)\s*$/g, "")
    .replace(/[-_\s]+\d{1,2}$/g, "")
    .replace(/[-_\s]+(front|back|side|sides|angle|sleeve|label|detail|rear|left|right|close|closeup|zoom|alt|view|inside|collar|pocket|main)$/i, "")
    .trim();
}

function seasonFrom(text: string) {
  const four = text.match(/\b(19|20)(\d{2})\b/);
  if (four) {
    const year = Number(`${four[1]}${four[2]}`);
    if (year >= 1900 && year <= 2030) return seasonCode(year);
  }
  const pair = text.match(/\b(\d{2})\s*[/-]\s*(\d{2})\b/);
  if (!pair) return "";
  const code = `${pair[1]}/${pair[2]}`;
  return seasonYear(code) == null ? "" : code;
}

function guessCategory(path: string): Category {
  const text = path.toLowerCase();
  if (/polo/.test(text)) return "polos";
  if (/formula|\bf1\b|racing jacket/.test(text)) return "f1";
  if (/\bnfl\b/.test(text)) return "nfl";
  if (/\bmlb\b|baseball|dodgers|yankees|barons/.test(text)) return "mlb";
  if (/rugby|all blacks|springbok/.test(text)) return "rugby";
  if (/full tracksuit|track suit|full kit/.test(text)) return "full-tracksuit";
  if (/hoodie/.test(text)) return "hoodies";
  if (/puffer/.test(text)) return "puffer";
  if (/windbreaker|double sided/.test(text)) return "windbreaker";
  if (/long sleeve/.test(text)) return "long-sleeves";
  if (/beanie/.test(text)) return "beanies";
  if (/banner/.test(text)) return "banners";
  if (/glove/.test(text)) return "gloves";
  if (/keychain|key ring/.test(text)) return "keychains";
  if (/scarf/.test(text)) return "scarfs";
  if (/flag/.test(text)) return "match-flag";
  if (/shin/.test(text)) return "shin-pads";
  if (/football|soccer ball/.test(text)) return "footballs";
  if (/sock/.test(text)) return "socks";
  if (/tracksuit/.test(text)) return "tracksuits";
  if (/jacket/.test(text)) return "retro-jackets";
  if (/baby|babies|infant/.test(text)) return "babies";
  if (/boot/.test(text)) return "boots";
  if (/international retro|nation retro/.test(text)) return "intl-retro";
  if (/retro/.test(text)) return "clubs-retro";
  if (/chiefs|pirates|sundowns|kaizer|bafana|springbok|local/.test(text)) return "local";
  return "leagues";
}

function rankFile(file: File) {
  const name = file.name.toLowerCase();
  if (/front|main|hero/.test(name)) return 0;
  if (/back|rear/.test(name)) return 3;
  if (ANGLE.test(stemOf(file.name) ? "x" : name.replace(/\.[^.]+$/, ""))) return 2;
  return 1;
}

function groupFiles(files: File[]): Batch[] {
  const images = files.filter((file) => file.type.startsWith("image/") || /\.(jpe?g|png|webp)$/i.test(file.name));
  const groups = new Map<string, { parent: string; stem: string; files: File[] }>();
  for (const file of images) {
    const rel = file.webkitRelativePath || file.name;
    const parts = rel.split("/").filter(Boolean);
    const filename = parts[parts.length - 1] || file.name;
    const parent = parts.length > 1 ? parts[parts.length - 2]! : "";
    const stem = stemOf(filename);
    const key = `${parent.toLowerCase()}/${(stem || "__angles").toLowerCase()}`;
    const group = groups.get(key) ?? { parent, stem, files: [] };
    group.files.push(file);
    groups.set(key, group);
  }
  return [...groups.entries()].map(([key, group]) => {
    const collection = collectionTitle(group.parent);
    const fromFile = looksLikeFileName(group.stem) ? "" : teamFromText(group.stem) || titleCase(group.stem);
    const fromFolder = collection || isCollectionLabel(group.parent) ? "" : teamFromText(group.parent) || titleCase(group.parent);
    const team = (fromFile || fromFolder).slice(0, 60);
    const name = (team ? kitTitle({ collection, team, colour: "", garment: "Short sleeve", withColour: false }) : "").slice(0, 80);
    const season = seasonFrom(`${group.parent} ${group.stem} ${group.files.map((file) => file.name).join(" ")}`);
    const filesSorted = [...group.files].sort((a, b) => rankFile(a) - rankFile(b) || a.name.localeCompare(b.name));
    return {
      key,
      name,
      team,
      collection,
      colour: "",
      garment: "Short sleeve",
      season,
      files: filesSorted.slice(0, 6),
    };
  });
}

export function PhotoDrop({
  shrink,
  onSaved,
}: {
  shrink: (file: File) => Promise<string>;
  onSaved: () => void;
}) {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [skipped, setSkipped] = useState("");
  const [category, setCategory] = useState<Category>("leagues");
  const [availability, setAvailability] = useState<Availability>("to_order");
  const [season, setSeason] = useState("");
  const [price, setPrice] = useState(String(listPrice("leagues") ?? 800));
  const [priceEdited, setPriceEdited] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  async function nameFromPhotos(next: Batch[]) {
    setReading(true);
    const named: Batch[] = [];
    const seen: Array<{ name: string; team: string; blurb: string }> = [];
    try {
      try {
        const live = await listPublicProducts();
        for (const product of live.products) seen.push(product);
      } catch {
        // The upload still checks the rail again before it saves.
      }
      for (let index = 0; index < next.length; index++) {
        const batch = next[index]!;
        setProgress(`Reading the team on ${index + 1} of ${next.length}`);
        let read: { team: string; colour: string; garment: string } = { team: "", colour: "", garment: "Short sleeve" };
        try {
          if (batch.files[0]) read = await readKitPhoto(batch.files[0]);
        } catch {
          read = { team: "", colour: "", garment: "Short sleeve" };
        }
        const team = read.team || batch.team;
        const colour = read.colour || "See photo";
        const garment = read.garment || "Short sleeve";
        if (!team || looksLikeFileName(team) || isCollectionLabel(team)) {
          named.push({ ...batch, team: "", name: "", colour, garment });
          continue;
        }
        const candidate = {
          name: kitTitle({ collection: batch.collection, team, colour, garment, withColour: true }),
          team,
          blurb: `Colour: ${colour}.`,
        };
        if (seen.some((item) => isSameKit(item, candidate)) || named.some((item) => isSameKit({ name: item.name, team: item.team, blurb: `Colour: ${item.colour}.` }, candidate))) continue;
        seen.push(candidate);
        const withColour = named.some((item) => item.team === team && item.garment === garment && item.collection === batch.collection && item.colour && item.colour !== colour);
        named.push({
          ...batch,
          team,
          colour,
          garment,
          name: kitTitle({ collection: batch.collection, team, colour, garment, withColour }),
        });
      }
      setBatches(named);
      const unread = named.filter((batch) => !batch.team).length;
      const duplicates = next.length - named.length;
      const notes = [
        unread ? `${unread} still need a team. Type it, or they will not be listed.` : "",
        duplicates > 0 ? `${duplicates} already on the rail, so ${duplicates === 1 ? "it was" : "they were"} not added again.` : "",
      ].filter(Boolean);
      setSkipped(notes.join(" "));
    } finally {
      setProgress("");
      setReading(false);
    }
  }

  function take(list: FileList | null) {
    if (!list || list.length === 0) return;
    const files = [...list];
    const grouped = groupFiles(files);
    const kept = grouped.slice(0, 40);
    const guess = guessCategory(files.map((file) => file.webkitRelativePath || file.name).join(" "));
    if (!priceEdited) {
      const listed = listPrice(guess);
      if (listed != null) setPrice(String(listed));
    }
    setCategory(guess);
    const shared = kept.find((batch) => batch.season)?.season ?? "";
    if (shared && kept.every((batch) => !batch.season || batch.season === shared)) setSeason(shared);
    setBatches(kept);
    setSkipped(grouped.length > kept.length ? `${grouped.length - kept.length} more kits were left out. Upload these, then drop the folder again.` : "");
    setError("");
    setProgress("");
    void nameFromPhotos(kept);
  }

  function patch(key: string, next: Partial<Batch>) {
    setBatches((current) =>
      current.map((batch) => {
        if (batch.key !== key) return batch;
        const merged = { ...batch, ...next };
        const team = merged.team.trim();
        if (!team || looksLikeFileName(team) || isCollectionLabel(team)) return { ...merged, name: "" };
        return {
          ...merged,
          name: kitTitle({
            collection: merged.collection,
            team,
            colour: merged.colour,
            garment: merged.garment || "Short sleeve",
            withColour: Boolean(merged.colour && merged.colour !== "Yellow" && merged.colour !== "White"),
          }),
        };
      }),
    );
  }

  async function upload() {
    if (batches.length === 0) return;
    const amount = Number(price);
    if (!Number.isInteger(amount) || amount < 1) {
      setError("Type a whole rand price first.");
      return;
    }
    setBusy(true);
    setError("");
    const sizeChart = chartForCategory(category);
    let done = 0;
    try {
      for (const batch of batches) {
        setProgress(`Stamping ${done + 1} of ${batches.length}: ${batch.name}`);
        const photos: string[] = [];
        for (const file of batch.files) {
          photos.push(await shrink(file));
        }
        const name = batch.name.trim();
        const team = batch.team.trim();
        if (!name || !team || looksLikeFileName(name) || looksLikeFileName(team)) continue;
        const result = await saveProduct({
          data: {
            slug: "",
            name,
            team,
            category,
            availability,
            price: amount,
            fanPrice: amount,
            boxPrice: null,
            boxFanPrice: null,
            blurb: `Colour: ${batch.colour || "See photo"}. Type: ${batch.garment || "Short sleeve"}.`,
            stock: availability === "on_hand" ? 1 : 0,
            image: photos[0] ?? "",
            gallery: photos.slice(1),
            hidden: false,
            sizeChart,
            printable: chartAllowsPrint(sizeChart),
            season: batch.season || season,
          },
        });
        if (!result.ok) {
          setError(`${name}: ${result.error}`);
          setProgress(`${done} added before that stop.`);
          return;
        }
        if (result.duplicate) continue;
        done += 1;
      }
      setBatches([]);
      setSkipped("");
      setProgress(done === 0 ? "Nothing new was added." : `${done} kit${done === 1 ? "" : "s"} added. They are on the shop.`);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add those pictures.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="border border-line bg-paper px-4 py-5">
      <h2 className="text-3xl uppercase">Upload a folder</h2>
      <p className="mt-2 text-sm text-muted">
        Pick a folder from your computer. Each photo is named from the team on the shirt, after the folder name when that is a tournament such as World Cup 2026. A kit already on the rail is skipped. Front and back of the same shirt stay together. Empty folders are skipped.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <label className="btn btn-ink">
          Choose folder
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            disabled={busy}
            onChange={(event) => {
              take(event.target.files);
              event.target.value = "";
            }}
            {...{ webkitdirectory: "", directory: "" }}
          />
        </label>
        <label className="btn btn-line">
          Or pick pictures
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            disabled={busy}
            onChange={(event) => {
              take(event.target.files);
              event.target.value = "";
            }}
          />
        </label>
      </div>

      {batches.length > 0 ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            Shelf
            <select
              className="field mt-1"
              value={category}
              onChange={(event) => {
                const next = event.target.value as Category;
                setCategory(next);
                if (!priceEdited) {
                  const listed = listPrice(next);
                  if (listed != null) setPrice(String(listed));
                }
              }}
            >
              {CATEGORIES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Stock
            <select className="field mt-1" value={availability} onChange={(event) => setAvailability(event.target.value as Availability)}>
              <option value="to_order">Available to order</option>
              <option value="on_hand">On hand</option>
            </select>
          </label>
          <label className="text-sm">
            Price (R)
            <input
              className="field mt-1"
              inputMode="numeric"
              value={price}
              onChange={(event) => {
                setPriceEdited(true);
                setPrice(event.target.value.replace(/[^\d]/g, ""));
              }}
            />
          </label>
          <label className="text-sm">
            Shirt year, if they share one
            <select className="field mt-1" value={season} onChange={(event) => setSeason(event.target.value)}>
              <option value="">No shared year</option>
              {[...SEASON_YEARS].reverse().map((year) => {
                const code = seasonCode(year);
                return (
                  <option key={year} value={code}>
                    {seasonText(code)}
                  </option>
                );
              })}
            </select>
          </label>
        </div>
      ) : null}

      {skipped ? <p className="mt-3 text-sm text-muted">{skipped}</p> : null}

      {batches.length > 0 ? (
        <ul className="mt-4 max-h-80 space-y-3 overflow-y-auto">
          {batches.map((batch) => (
            <li key={batch.key} className="grid gap-2 border border-line bg-bone p-3 sm:grid-cols-[1fr_1fr_auto]">
              <label className="text-sm">
                Name
                <input className="field mt-1" value={batch.name} onChange={(event) => patch(batch.key, { name: event.target.value })} />
              </label>
              <label className="text-sm">
                Team
                <input className="field mt-1" value={batch.team} onChange={(event) => patch(batch.key, { team: event.target.value })} />
              </label>
              <p className="self-end text-xs text-muted">
                {batch.files.length} photo{batch.files.length === 1 ? "" : "s"}
                {batch.season ? ` · ${batch.season}` : ""}
                {" · "}
                {categoryLabel(category)}
              </p>
            </li>
          ))}
        </ul>
      ) : null}

      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      {progress ? <p className="mt-3 text-sm text-muted">{progress}</p> : null}

      {batches.length > 0 ? (
        <button type="button" className="btn btn-primary mt-4" disabled={busy || reading} onClick={() => void upload()}>
          {reading ? "Reading teams…" : busy ? "Adding…" : `Add ${batches.length} kit${batches.length === 1 ? "" : "s"}`}
        </button>
      ) : null}
    </section>
  );
}
