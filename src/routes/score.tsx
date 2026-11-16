import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { AccountGate, SignedInLine } from "@/components/account-gate";
import { formatMoney } from "@/data/catalog";
import { SCORE_FEE, SCORE_GAMES, scoreWindow } from "@/data/weekend";
import { enterScoreCompetition } from "@/lib/community.functions";
import { useShop } from "@/lib/store";
import { whatsAppUrl, WHATSAPP_DISPLAY } from "@/lib/whatsapp-order";

export const Route = createFileRoute("/score")({
  head: () => ({ meta: [{ title: "Correct score · J.I.S" }] }),
  component: ScorePage,
});

function ScorePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <p className="text-xs uppercase tracking-widest text-brass">Competition</p>
      <h1 className="mt-2 text-5xl uppercase">Correct score</h1>
      <AccountGate
        needAdult
        reason="The competition is for registered customers, 18 and over. Browsing the shop stays open. Sign up with an email or a mobile number."
      >
        <EntryForm />
      </AccountGate>
    </main>
  );
}

function EntryForm() {
  const draw = scoreWindow();
  const account = useShop((s) => s.account);
  const [shirt, setShirt] = useState("");
  const [scores, setScores] = useState<Record<string, { home: string; away: string }>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState("");
  const [chances, setChances] = useState(0);

  function setSide(id: string, side: "home" | "away", value: string) {
    setScores((current) => ({
      ...current,
      [id]: { home: current[id]?.home ?? "", away: current[id]?.away ?? "", [side]: value.replace(/\D/g, "").slice(0, 2) },
    }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!account) return;
    setError("");
    const picks = SCORE_GAMES.map((game) => ({
      id: game.id,
      home: Number(scores[game.id]?.home),
      away: Number(scores[game.id]?.away),
    }));
    setBusy(true);
    const popup = window.open("about:blank", "_blank");
    try {
      const result = await enterScoreCompetition({
        data: {
          customerId: account.id,
          name: account.name,
          contact: account.email || account.phone,
          shirt,
          picks,
        },
      });
      if (!result.ok) {
        popup?.close();
        setError(result.error);
        setBusy(false);
        return;
      }
      const lines = [
        `J.I.S correct score ${result.id}`,
        account.name,
        account.email || account.phone,
        `Shirt if I get all 7: ${shirt.trim()}`,
        `Chance ${result.chances} this round. Entry fee ${formatMoney(SCORE_FEE)}. Please confirm payment.`,
        ...SCORE_GAMES.map((game) => {
          const pick = result.picks.find((row) => row.id === game.id);
          return `${game.home} ${pick?.home}-${pick?.away} ${game.away}`;
        }),
      ];
      const url = whatsAppUrl(lines.join("\n"));
      if (popup) popup.location.href = url;
      else window.location.href = url;
      setDone(result.id);
      setChances(result.chances);
    } catch (err) {
      popup?.close();
      setError(err instanceof Error ? err.message : "Could not save the entry.");
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div>
        <SignedInLine />
        <p className="mt-4 max-w-xl text-sm text-muted">
          Entry {done} is in. That is chance {chances} in this round. Finish the {formatMoney(SCORE_FEE)} on WhatsApp to {WHATSAPP_DISPLAY}. Each extra entry is another chance if you get all 7 right. The shirt is drawn among the correct entries. An entry is not refunded.
        </p>
        <button
          type="button"
          className="btn btn-line mt-4"
          onClick={() => {
            setDone("");
            setError("");
          }}
        >
          Enter again · another chance
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-4 max-w-2xl" noValidate>
      <SignedInLine />
      <p className="mt-3 max-w-xl text-sm text-muted">
        The R100 draw is open in the first week and the last week of every month.
        {draw.open
          ? ` This window is ${draw.label}.`
          : ` It is closed right now. Next window: ${draw.next}.`}{" "}
        Seven Betway Premiership matches, Friday 27 to Sunday 29 November. Kick-offs are South African time. Entry is {formatMoney(SCORE_FEE)}, paid on WhatsApp, not by card. Get all 7 right and that entry goes into the draw for one customised shirt. The more entries you send, the more chances you have. 18+ only. J.I.S does not take bets.
      </p>
      {!draw.open ? null : (
        <>
      <ul className="mt-6 grid gap-3">
        {SCORE_GAMES.map((game) => (
          <li key={game.id} className="border border-line px-3 py-3">
            <p className="text-xs uppercase tracking-widest text-muted">{game.when}</p>
            <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
              <span className="text-sm">{game.home}</span>
              <span className="flex items-center gap-1">
                <input
                  className="field w-14 text-center"
                  inputMode="numeric"
                  aria-label={`${game.home} score`}
                  value={scores[game.id]?.home ?? ""}
                  onChange={(e) => setSide(game.id, "home", e.target.value)}
                />
                <span className="text-muted">-</span>
                <input
                  className="field w-14 text-center"
                  inputMode="numeric"
                  aria-label={`${game.away} score`}
                  value={scores[game.id]?.away ?? ""}
                  onChange={(e) => setSide(game.id, "away", e.target.value)}
                />
              </span>
              <span className="text-right text-sm">{game.away}</span>
            </div>
          </li>
        ))}
      </ul>
      <label className="mt-4 block text-sm">
        Shirt if you win
        <input className="field mt-1" value={shirt} onChange={(e) => setShirt(e.target.value)} placeholder="Club, year, size" />
      </label>
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      <button className="btn btn-primary mt-5" type="submit" disabled={busy}>
        {busy ? "Sending…" : `Enter · ${formatMoney(SCORE_FEE)} on WhatsApp`}
      </button>
        </>
      )}
    </form>
  );
}
