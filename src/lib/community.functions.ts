import { createServerFn } from "@tanstack/react-start";
import { contactOk, normalMobile, validEmail, validMobile } from "@/lib/account";
import { SCORE_GAMES, penaltyRound, scoreWindow } from "@/data/weekend";

export type NewsItem = {
  title: string;
  link: string;
  source: string;
  published: string;
};

const FEEDS = [
  { source: "BBC Sport", url: "https://feeds.bbci.co.uk/sport/rss.xml" },
  { source: "BBC Football", url: "https://feeds.bbci.co.uk/sport/football/rss.xml" },
  { source: "ESPN", url: "https://www.espn.com/espn/rss/news" },
  { source: "ESPN Soccer", url: "https://www.espn.com/espn/rss/soccer/news" },
  { source: "Sky Sports", url: "https://www.skysports.com/rss/12040" },
  { source: "The Guardian", url: "https://www.theguardian.com/sport/rss" },
  { source: "News24 Sport", url: "https://feeds.news24.com/articles/sport/rss" },
];

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

type NewsCache = { at: number; items: NewsItem[] };
type BoardCache = { at: number; results: string[]; fixtures: DailyFixture[] };
const memory = globalThis as typeof globalThis & { __jisNews?: NewsCache; __jisBoard?: BoardCache };

export type DailyFixture = {
  id: string;
  sport: "Football" | "Rugby" | "NFL";
  when: string;
  home: string;
  away: string;
  league: string;
  score: string | null;
  status: string;
  lean: string;
};

function decode(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, '"')
    .replace(/&#39;|'/g, "'")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function tag(block: string, name: string) {
  const match = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return match ? decode(match[1]) : "";
}

function parseFeed(xml: string, source: string): NewsItem[] {
  return xml
    .split(/<item\b/i)
    .slice(1, 7)
    .map((block) => {
      const title = tag(block, "title");
      const link = tag(block, "link") || (block.match(/<link[^>]+href="([^"]+)"/i)?.[1] ?? "");
      const published = tag(block, "pubDate") || tag(block, "published");
      return { title, link, source, published };
    })
    .filter((item) => item.title.length > 8 && item.link.startsWith("http"));
}

async function pullFeeds(): Promise<NewsItem[]> {
  const batches = await Promise.all(
    FEEDS.map(async (feed) => {
      try {
        const response = await fetch(feed.url, {
          headers: { "user-agent": "JIS-News/1.0" },
          signal: AbortSignal.timeout(8000),
        });
        if (!response.ok) return [];
        return parseFeed(await response.text(), feed.source);
      } catch {
        return [];
      }
    }),
  );
  const seen = new Set<string>();
  const items: NewsItem[] = [];
  for (const batch of batches) {
    for (const item of batch) {
      const key = item.title.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      items.push(item);
    }
  }
  return items.slice(0, 24);
}

export const listSportNews = createServerFn({ method: "GET" }).handler(async () => {
  const cached = memory.__jisNews;
  if (cached && Date.now() - cached.at < HOUR && cached.items.length > 0) {
    return { items: cached.items, updatedAt: new Date(cached.at).toISOString(), fresh: false };
  }
  const items = await pullFeeds();
  if (items.length === 0 && cached) {
    return { items: cached.items, updatedAt: new Date(cached.at).toISOString(), fresh: false };
  }
  const at = Date.now();
  memory.__jisNews = { at, items };
  return { items, updatedAt: new Date(at).toISOString(), fresh: true };
});

const BOARD_SPORTS = [
  { sport: "Football", query: "Soccer" },
  { sport: "Rugby", query: "Rugby" },
  { sport: "NFL", query: "American Football" },
] as const;

function sastDay(offsetDays: number) {
  return new Date(Date.now() + 2 * 60 * 60 * 1000 + offsetDays * DAY).toISOString().slice(0, 10);
}

function kickoffLabel(event: { strTimestamp?: string | null; dateEvent?: string | null; strTime?: string | null }) {
  const stamp = event.strTimestamp?.trim();
  if (stamp) {
    const date = new Date(stamp.endsWith("Z") ? stamp : `${stamp}Z`);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString("en-ZA", {
        timeZone: "Africa/Johannesburg",
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  }
  return [event.dateEvent, event.strTime?.slice(0, 5)].filter(Boolean).join(" · ");
}

function isFinished(event: { strStatus?: string | null; intHomeScore?: string | null; intAwayScore?: string | null }) {
  const status = (event.strStatus ?? "").toUpperCase();
  if (status === "FT" || status === "AET" || status === "PEN" || status.includes("FULL")) return true;
  if (status === "NS" || status === "" || status === "NOT STARTED") return false;
  return event.intHomeScore != null && event.intAwayScore != null;
}

async function pullDay(day: string, sport: DailyFixture["sport"], query: string): Promise<DailyFixture[]> {
  try {
    const response = await fetch(
      `https://www.thesportsdb.com/api/v1/json/123/eventsday.php?d=${day}&s=${encodeURIComponent(query)}`,
      { headers: { "user-agent": "JIS-News/1.0" }, signal: AbortSignal.timeout(8000) },
    );
    if (!response.ok) return [];
    const body = (await response.json()) as { events?: Record<string, string | null>[] | null };
    return (body.events ?? []).map((event) => {
      const home = event.strHomeTeam ?? "Home";
      const away = event.strAwayTeam ?? "Away";
      const finished = isFinished(event);
      const score =
        finished && event.intHomeScore != null && event.intAwayScore != null
          ? `${event.intHomeScore}–${event.intAwayScore}`
          : null;
      return {
        id: event.idEvent ?? `${sport}-${home}-${away}-${day}`,
        sport,
        when: kickoffLabel(event),
        home,
        away,
        league: event.strLeague ?? sport,
        score,
        status: finished ? "Full time" : "Not started",
        lean: "",
      };
    });
  } catch {
    return [];
  }
}

const TABLES = [
  { league: "English Premier League", id: "4328" },
  { league: "Spanish La Liga", id: "4335" },
  { league: "Italian Serie A", id: "4332" },
  { league: "German Bundesliga", id: "4331" },
  { league: "French Ligue 1", id: "4334" },
];

type TableSide = { name: string; points: number; league: string };

async function pullTables(): Promise<TableSide[]> {
  const seasons = ["2026-2027", "2025-2026"];
  const sides: TableSide[] = [];
  for (const table of TABLES) {
    for (const season of seasons) {
      try {
        const response = await fetch(
          `https://www.thesportsdb.com/api/v1/json/123/lookuptable.php?l=${table.id}&s=${season}`,
          { headers: { "user-agent": "JIS-News/1.0" }, signal: AbortSignal.timeout(8000) },
        );
        if (!response.ok) continue;
        const body = (await response.json()) as { table?: { strTeam?: string; intPoints?: string }[] | null };
        const rows = body.table ?? [];
        if (rows.length === 0) continue;
        for (const row of rows) {
          if (!row.strTeam) continue;
          sides.push({ name: row.strTeam, points: Number(row.intPoints ?? 0), league: table.league });
        }
        break;
      } catch {
        continue;
      }
    }
  }
  return sides;
}

function sidePoints(sides: TableSide[], team: string, league: string) {
  const key = team.toLowerCase();
  const row = sides.find((side) => league.toLowerCase().includes(side.league.toLowerCase().slice(0, 8)) && side.name.toLowerCase() === key)
    ?? sides.find((side) => side.name.toLowerCase() === key);
  return row ? row.points : null;
}

/** Home edge plus league points. Same inputs the public tip sites use: table and venue. No made-up score. */
function leanFromTable(fixture: DailyFixture, sides: TableSide[]) {
  const home = sidePoints(sides, fixture.home, fixture.league);
  const away = sidePoints(sides, fixture.away, fixture.league);
  if (home == null || away == null) return "";
  const homeEdge = home + 3;
  if (homeEdge >= away + 8) return `${fixture.home} on the table, with a home edge. Not a score.`;
  if (away >= home + 6) return `${fixture.away} on the table, even away. Not a score.`;
  return "Too close on the table to call. Not a score.";
}

export const listDailyBoard = createServerFn({ method: "GET" }).handler(async () => {
  const cached = memory.__jisBoard;
  if (cached && Date.now() - cached.at < HOUR && (cached.results.length > 0 || cached.fixtures.length > 0)) {
    return { results: cached.results, fixtures: cached.fixtures, updatedAt: new Date(cached.at).toISOString(), fresh: false };
  }
  const seen = new Set<string>();
  const fixtures: DailyFixture[] = [];
  for (const day of [sastDay(-1), sastDay(0), sastDay(1)]) {
    for (const sport of BOARD_SPORTS) {
      for (const fixture of await pullDay(day, sport.sport, sport.query)) {
        if (seen.has(fixture.id)) continue;
        seen.add(fixture.id);
        fixtures.push(fixture);
      }
    }
  }
  const tables = await pullTables();
  for (const fixture of fixtures) {
    if (fixture.score) continue;
    fixture.lean = leanFromTable(fixture, tables);
  }
  const results = fixtures
    .filter((fixture) => fixture.score)
    .map((fixture) => `${fixture.home} ${fixture.score} ${fixture.away} · ${fixture.league}`);
  const open = fixtures.filter((fixture) => !fixture.score);
  if (results.length === 0 && open.length === 0 && cached) {
    return { results: cached.results, fixtures: cached.fixtures, updatedAt: new Date(cached.at).toISOString(), fresh: false };
  }
  const at = Date.now();
  memory.__jisBoard = { at, results, fixtures: open.length > 0 ? open : fixtures };
  return {
    results,
    fixtures: memory.__jisBoard.fixtures,
    updatedAt: new Date(at).toISOString(),
    fresh: true,
  };
});

export const registerCustomer = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(async ({ data }) => {
    if (!data || typeof data !== "object") return { ok: false as const, error: "Missing details." };
    const raw = data as Record<string, unknown>;
    const name = typeof raw.name === "string" ? raw.name.trim() : "";
    const email = typeof raw.email === "string" ? raw.email.trim() : "";
    const phone = typeof raw.phone === "string" ? normalMobile(raw.phone) : "";
    if (name.length < 2 || name.length > 80) return { ok: false as const, error: "Add your name." };
    if (email && !validEmail(email)) return { ok: false as const, error: "That email does not look right." };
    if (phone && !validMobile(phone)) return { ok: false as const, error: "Use a South African mobile, like 082 000 0000." };
    if (!contactOk(email, phone)) return { ok: false as const, error: "Add an email or a mobile number." };
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`alter table customers add column if not exists verified boolean not null default true`;
    await sql`
      create table if not exists customer_codes (
        customer_id text primary key,
        code text not null,
        expires_at timestamptz not null
      )
    `;
    type Row = { id: string; name: string; email: string; phone: string; verified: boolean };
    const existing = email
      ? await sql<Row>`select id, name, email, phone, verified from customers where lower(email) = lower(${email}) limit 1`
      : await sql<Row>`select id, name, email, phone, verified from customers where phone = ${phone} limit 1`;
    const found = existing[0];
    if (found?.verified !== false && found) {
      return { ok: true as const, verified: true as const, id: found.id, name: found.name, email: found.email, phone: found.phone };
    }
    const id = found?.id ?? `CUS-${Date.now().toString(36).toUpperCase()}`;
    if (!found) {
      await sql`insert into customers (id, name, email, phone, verified) values (${id}, ${name}, ${email}, ${phone}, false)`;
    }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expires = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    await sql`
      insert into customer_codes (customer_id, code, expires_at) values (${id}, ${code}, ${expires})
      on conflict (customer_id) do update set code = excluded.code, expires_at = excluded.expires_at
    `;
    return {
      ok: true as const,
      verified: false as const,
      id,
      name: found?.name ?? name,
      email,
      phone,
      channel: email ? ("email" as const) : ("sms" as const),
      code,
    };
  });

export const confirmCustomer = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(async ({ data }) => {
    if (!data || typeof data !== "object") return { ok: false as const, error: "Missing the code." };
    const raw = data as Record<string, unknown>;
    const id = typeof raw.id === "string" ? raw.id.trim() : "";
    const code = typeof raw.code === "string" ? raw.code.replace(/\D/g, "") : "";
    if (!id.startsWith("CUS-") || code.length !== 6) return { ok: false as const, error: "Enter the 6-digit code." };
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<{ code: string; expires_at: string; name: string; email: string; phone: string }>`
      select c.code, c.expires_at::text as expires_at, u.name, u.email, u.phone
      from customer_codes c
      join customers u on u.id = c.customer_id
      where c.customer_id = ${id}
      limit 1
    `;
    const row = rows[0];
    if (!row || row.code !== code || new Date(row.expires_at).getTime() < Date.now()) {
      return { ok: false as const, error: "That code is wrong or it has expired. Ask for a new one." };
    }
    await sql`update customers set verified = true where id = ${id}`;
    await sql`delete from customer_codes where customer_id = ${id}`;
    return { ok: true as const, id, name: row.name, email: row.email, phone: row.phone };
  });

export const enterScoreCompetition = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(async ({ data }) => {
    if (!data || typeof data !== "object") return { ok: false as const, error: "Missing entry." };
    const raw = data as Record<string, unknown>;
    const customerId = typeof raw.customerId === "string" ? raw.customerId.trim() : "";
    const name = typeof raw.name === "string" ? raw.name.trim() : "";
    const contact = typeof raw.contact === "string" ? raw.contact.trim() : "";
    const shirt = typeof raw.shirt === "string" ? raw.shirt.trim().slice(0, 80) : "";
    if (!customerId.startsWith("CUS-") || name.length < 2) return { ok: false as const, error: "Sign up first." };
    if (contact.length < 5) return { ok: false as const, error: "Add the email or mobile on your account." };
    if (shirt.length < 2) return { ok: false as const, error: "Say which shirt you want if you win." };
    if (!Array.isArray(raw.picks) || raw.picks.length !== SCORE_GAMES.length) {
      return { ok: false as const, error: "Enter a score for every game." };
    }
    const window = scoreWindow();
    if (!window.open) {
      return { ok: false as const, error: `The draw is closed. It opens again ${window.next}.` };
    }
    const picks: { id: string; home: number; away: number }[] = [];
    for (const game of SCORE_GAMES) {
      const row = raw.picks.find((item) => item && typeof item === "object" && (item as { id?: string }).id === game.id) as
        | { id?: string; home?: unknown; away?: unknown }
        | undefined;
      const home = Number(row?.home);
      const away = Number(row?.away);
      if (!Number.isInteger(home) || !Number.isInteger(away) || home < 0 || home > 15 || away < 0 || away > 15) {
        return { ok: false as const, error: `Add a score for ${game.home} vs ${game.away}.` };
      }
      picks.push({ id: game.id, home, away });
    }
    const id = `SC-${Date.now().toString(36).toUpperCase()}`;
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const prior = await sql<{ id: string }>`
      select id from score_entries where round_id = ${window.id} and customer_id = ${customerId}
    `;
    await sql`
      insert into score_entries (id, round_id, customer_id, name, contact, shirt, picks)
      values (${id}, ${window.id}, ${customerId}, ${name}, ${contact}, ${shirt}, ${JSON.stringify(picks)}::jsonb)
    `;
    return { ok: true as const, id, picks, chances: prior.length + 1 };
  });

export const enterPenaltyDraw = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(async ({ data }) => {
    if (!data || typeof data !== "object") return { ok: false as const, error: "Missing entry." };
    const raw = data as Record<string, unknown>;
    const customerId = typeof raw.customerId === "string" ? raw.customerId.trim() : "";
    const name = typeof raw.name === "string" ? raw.name.trim() : "";
    const contact = typeof raw.contact === "string" ? raw.contact.trim() : "";
    if (!customerId.startsWith("CUS-") || name.length < 2) return { ok: false as const, error: "Sign up to enter the draw." };
    if (contact.length < 5) return { ok: false as const, error: "Add the email or mobile on your account." };
    const round = penaltyRound();
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`
      create table if not exists penalty_entries (
        id text primary key,
        round_id text not null,
        customer_id text not null,
        name text not null,
        contact text not null,
        created_at timestamptz not null default now(),
        unique (round_id, customer_id)
      )
    `;
    const existing = await sql<{ id: string }>`
      select id from penalty_entries where round_id = ${round} and customer_id = ${customerId} limit 1
    `;
    if (existing[0]) return { ok: true as const, already: true as const, round };
    const id = `PEN-${Date.now().toString(36).toUpperCase()}`;
    await sql`
      insert into penalty_entries (id, round_id, customer_id, name, contact)
      values (${id}, ${round}, ${customerId}, ${name}, ${contact})
    `;
    return { ok: true as const, already: false as const, round, id };
  });
