import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AccountGate, SignedInLine } from "@/components/account-gate";
import { listDailyBoard, type DailyFixture } from "@/lib/community.functions";

export const Route = createFileRoute("/tips")({
  head: () => ({ meta: [{ title: "Daily tips · J.I.S" }] }),
  component: TipsPage,
});

const SPORTS = ["Football", "Rugby", "NFL"] as const;

function TipsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <p className="text-xs uppercase tracking-widest text-brass">Daily board</p>
      <h1 className="mt-2 text-5xl uppercase">Tips</h1>
      <AccountGate
        needAdult
        reason="Tips are for registered customers, 18 and over. You can still browse the shop without an account. Sign up with an email or a mobile number."
      >
        <DailyBoard />
      </AccountGate>
    </main>
  );
}

function DailyBoard() {
  const [fixtures, setFixtures] = useState<DailyFixture[]>([]);
  const [results, setResults] = useState<string[]>([]);
  const [updatedAt, setUpdatedAt] = useState("");
  const [quiet, setQuiet] = useState(false);

  useEffect(() => {
    let live = true;
    const load = () => {
      listDailyBoard()
        .then((board) => {
          if (!live) return;
          setFixtures(board.fixtures);
          setResults(board.results);
          setUpdatedAt(board.updatedAt);
          setQuiet(board.fixtures.length === 0 && board.results.length === 0);
        })
        .catch(() => {
          if (live) setQuiet(true);
        });
    };
    load();
    const timer = window.setInterval(load, 60 * 60 * 1000);
    return () => {
      live = false;
      window.clearInterval(timer);
    };
  }, []);

  const when = updatedAt
    ? new Date(updatedAt).toLocaleString("en-ZA", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })
    : "";

  return (
    <div>
      <SignedInLine />
      <p className="mt-3 max-w-xl text-sm text-muted">
        Today’s football, rugby and NFL, checked every hour. A finished match shows the result. An open match can show a read from the league table and a home edge, the same kind of inputs used by Football Whispers, Windrawwin and BetMines. It is not their tip, and it is not a score. J.I.S is not a bookmaker and does not take bets. 18+ only. Gamble responsibly.{" "}
        <a className="underline" href="https://footballwhispers.com/blog/champions-league-betting/">Football Whispers</a>
        {" · "}
        <a className="underline" href="https://www.windrawwin.com/predictions/today/popular-leagues/">Windrawwin</a>
        {" · "}
        <a className="underline" href="https://betmines.com/">BetMines</a>
      </p>
      {when ? <p className="mt-2 text-xs uppercase tracking-widest text-muted">Updated {when}</p> : null}
      {results.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-3xl uppercase">Results</h2>
          <ul className="mt-3 grid gap-2">
            {results.map((line) => (
              <li key={line} className="border border-line bg-paper px-4 py-3 text-sm">
                {line}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {SPORTS.map((sport) => {
        const games = fixtures.filter((game) => game.sport === sport);
        if (games.length === 0) return null;
        return (
          <section key={sport} className="mt-8">
            <h2 className="text-3xl uppercase">{sport}</h2>
            <ul className="mt-3 grid gap-3">
              {games.map((game) => (
                <li key={game.id} className="border border-line bg-paper p-4">
                  <p className="text-xs uppercase tracking-widest text-brass">
                    {game.when} · {game.league}
                  </p>
                  <h3 className="mt-1 text-2xl uppercase">
                    {game.home} vs {game.away}
                  </h3>
                  <p className="mt-3 text-sm">
                    {game.score ? (
                      <>
                        Full time: <span className="text-brass">{game.score}</span>
                      </>
                    ) : game.lean ? (
                      game.lean
                    ) : (
                      <span className="text-muted">Not started. No score called.</span>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      {quiet ? <p className="mt-6 text-sm text-muted">The day’s fixtures are quiet right now. Check again in a little while.</p> : null}
    </div>
  );
}
