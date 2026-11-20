/** Names and duplicate checks for kits dropped onto the desk. */

const TEAMS: Array<[RegExp, string]> = [
  [/\bbrasil\b|\bbrazil\b/, "Brazil"],
  [/\bengland\b|\bthree lions\b/, "England"],
  [/\bfrance\b|\bfrench\b/, "France"],
  [/\bspain\b|\bespana\b|\bespaña\b/, "Spain"],
  [/\bgermany\b|\bdeutschland\b/, "Germany"],
  [/\bargentina\b/, "Argentina"],
  [/\bmexico\b|\bmexico\b/, "Mexico"],
  [/\bportugal\b/, "Portugal"],
  [/\buruguay\b/, "Uruguay"],
  [/\bcanada\b/, "Canada"],
  [/\begypt\b/, "Egypt"],
  [/\bscotland\b/, "Scotland"],
  [/\bsweden\b|\bsverige\b/, "Sweden"],
  [/\bunited states\b|\busa\b|\busmnt\b/, "USA"],
  [/\bvenezuela\b/, "Venezuela"],
  [/\bsouth africa\b|\bbafana\b/, "South Africa"],
  [/\bnetherlands\b|\bholland\b/, "Netherlands"],
  [/\bitaly\b|\bitalia\b/, "Italy"],
  [/\bbelgium\b/, "Belgium"],
  [/\bcroatia\b/, "Croatia"],
  [/\bjapan\b/, "Japan"],
  [/\bnigeria\b/, "Nigeria"],
  [/\bghana\b/, "Ghana"],
  [/\bsenegal\b/, "Senegal"],
  [/\bmorocco\b/, "Morocco"],
  [/\bcolombia\b/, "Colombia"],
  [/\bchile\b/, "Chile"],
  [/\bchelsea\b/, "Chelsea"],
  [/\barsenal\b/, "Arsenal"],
  [/\bliverpool\b/, "Liverpool"],
  [/\bmanchester city\b/, "Manchester City"],
  [/\bmanchester united\b/, "Manchester United"],
  [/\btottenham\b|\bspurs\b/, "Tottenham"],
  [/\breal madrid\b/, "Real Madrid"],
  [/\bbarcelona\b|\bbarca\b/, "Barcelona"],
  [/\bbayern\b/, "Bayern Munich"],
  [/\bjuventus\b/, "Juventus"],
  [/\bpsg\b|\bparis saint\b/, "Paris Saint-Germain"],
  [/\bkaizer chiefs\b|\bchiefs\b/, "Kaizer Chiefs"],
  [/\borlando pirates\b|\bpirates\b/, "Orlando Pirates"],
  [/\bmamelodi sundowns\b|\bsundowns\b/, "Mamelodi Sundowns"],
];

export function looksLikeFileName(value: string) {
  const text = value
    .toLowerCase()
    .replace(/\.(jpe?g|png|webp|gif)$/g, "")
    .replace(/[_-]+/g, " ")
    .trim();
  if (!text) return true;
  if (/^\d+(\s+(small|medium|large|sm|md|lg))?$/.test(text)) return true;
  if (/^(img|dsc|photo|image|picture|whatsapp image)\s*\d*$/.test(text)) return true;
  return false;
}

export function collectionTitle(value: string) {
  const text = value.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  const worldCup = text.match(/world\s+cup\s+(20\d{2})/i);
  if (worldCup) return `World Cup ${worldCup[1]}`;
  return "";
}

export function isCollectionLabel(value: string) {
  return Boolean(collectionTitle(value)) || /^(photos?|images?|kits?|uploads?|new folder)$/i.test(value.trim());
}

export function teamFromText(value: string) {
  const text = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  let found = "";
  let length = 0;
  for (const [pattern, team] of TEAMS) {
    const match = pattern.exec(text);
    if (match && match[0].length >= length) {
      found = team;
      length = match[0].length;
    }
  }
  return found;
}

export function kitTitle(input: { collection: string; team: string; colour: string; garment: string; withColour: boolean }) {
  const collection = input.collection.trim();
  const team = input.team.trim();
  let name = collection ? `${collection} ${team}` : team;
  if (input.garment === "Shorts") name += " shorts";
  else if (input.garment === "Long sleeve") name += ", long sleeve";
  else if (input.withColour && input.colour) name += `, ${input.colour.toLowerCase()}`;
  return name.replace(/\s+/g, " ").trim().slice(0, 80);
}

export function listingIdentity(input: { name: string; team: string; blurb: string }) {
  const collection = collectionTitle(input.name) || collectionTitle(input.team);
  const team = (teamFromText(input.team) || teamFromText(input.name) || input.team.trim()).toLowerCase();
  const statedColour = input.blurb.match(/Colour:\s*([^.]+)/i)?.[1]?.trim().toLowerCase() ?? "";
  const colour = statedColour || "see photo";
  const garment = /shorts/.test(input.name.toLowerCase())
    ? "shorts"
    : /long sleeve/.test(`${input.name} ${input.blurb}`.toLowerCase())
      ? "long sleeve"
      : "short sleeve";
  return `${collection.toLowerCase()}|${team}|${colour}|${garment}`;
}

export function isSameKit(
  a: { name: string; team: string; blurb: string },
  b: { name: string; team: string; blurb: string },
) {
  const left = listingIdentity(a).split("|");
  const right = listingIdentity(b).split("|");
  const coloursDiffer = left[2] !== "see photo" && right[2] !== "see photo" && left[2] !== right[2];
  if (coloursDiffer) return false;
  const sameName = a.name.trim().toLowerCase() === b.name.trim().toLowerCase() && a.name.trim().length > 3;
  if (sameName) return true;
  if (!left[1] || left[1] !== right[1] || left[0] !== right[0] || left[3] !== right[3]) return false;
  return left[2] !== "see photo" && left[2] === right[2];
}

/** "Mens Real Madrid 202627 Third Long Sleeve Jersey Small" → Real Madrid, third long sleeve. */
export function tidyKitLabel(name: string, team: string, season: string) {
  const source = `${name} ${team}`.replace(/[_]+/g, " ").replace(/\s+/g, " ").trim();
  const match = source.match(
    /(?:mens|men'?s|men)\s+(.+?)\s+(20)(\d{2})\s*(\d{2})\s+(home|away|third|fourth)?\s*(long sleeve|short sleeve|jersey)?/i,
  );
  if (!match) return { name: name.trim(), team: team.trim(), season };
  const club = (match[1] ?? "").replace(/\b(small|medium|large)\b/gi, "").replace(/\s+/g, " ").trim();
  const variant = (match[5] ?? "").toLowerCase();
  const garment = /long sleeve/i.test(source) ? "long sleeve" : (match[6] ?? "jersey").toLowerCase();
  const title = [club, variant, garment].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
  return {
    name: title.slice(0, 80),
    team: club.slice(0, 60),
    season: season || `${match[3]}/${match[4]}`,
  };
}
