import { useState, type FormEvent, type ReactNode } from "react";
import { contactOk, validEmail, validMobile } from "@/lib/account";
import { registerCustomer } from "@/lib/community.functions";
import { useShop, type Account } from "@/lib/store";

export function AccountGate({
  children,
  reason,
  needAdult = false,
  className = "",
}: {
  children: ReactNode;
  reason: string;
  needAdult?: boolean;
  className?: string;
}) {
  const account = useShop((s) => s.account);
  const setAccount = useShop((s) => s.setAccount);
  const [name, setName] = useState(account?.name ?? "");
  const [mode, setMode] = useState<"email" | "mobile">(account?.phone ? "mobile" : "email");
  const [email, setEmail] = useState(account?.email ?? "");
  const [phone, setPhone] = useState(account?.phone ?? "");
  const [over18, setOver18] = useState(account?.over18 ?? false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (account && (!needAdult || account.over18)) return children;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (account && needAdult) {
      if (!over18) {
        setError("You need to be 18 or over for this.");
        return;
      }
      setAccount({ ...account, over18: true });
      return;
    }
    if (name.trim().length < 2) {
      setError("Add your name.");
      return;
    }
    const nextEmail = mode === "email" ? email.trim() : "";
    const nextPhone = mode === "mobile" ? phone.trim() : "";
    if (mode === "email" && !validEmail(nextEmail)) {
      setError("Add a real email.");
      return;
    }
    if (mode === "mobile" && !validMobile(nextPhone)) {
      setError("Use a South African mobile, like 082 000 0000.");
      return;
    }
    if (!contactOk(nextEmail, nextPhone)) {
      setError("Add an email or a mobile number.");
      return;
    }
    if (needAdult && !over18) {
      setError("You need to be 18 or over for this.");
      return;
    }
    setBusy(true);
    try {
      const result = await registerCustomer({ data: { name, email: nextEmail, phone: nextPhone } });
      if (!result.ok) {
        setError(result.error);
        setBusy(false);
        return;
      }
      const saved: Account = {
        id: result.id,
        name: result.name,
        email: result.email,
        phone: result.phone,
        over18: needAdult ? over18 : account?.over18 ?? false,
      };
      setAccount(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your account.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className={`border border-line bg-paper p-5 ${className}`} noValidate>
      <p className="text-xs uppercase tracking-widest text-brass">Account</p>
      <h2 className="mt-2 text-3xl uppercase">{account ? "Confirm your age" : "Sign up to continue"}</h2>
      <p className="mt-2 text-sm text-muted">{reason}</p>
      {account ? (
        <p className="mt-3 text-sm">
          {account.name}
          {account.email || account.phone ? <span className="text-muted"> · {account.email || account.phone}</span> : null}
        </p>
      ) : (
        <>
          <label className="mt-4 block text-sm">
            Name
            <input className="field mt-1" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </label>
          <div className="mt-4 flex gap-2">
            <button type="button" className={`btn ${mode === "email" ? "btn-primary" : "btn-line"}`} onClick={() => setMode("email")}>
              Email
            </button>
            <button type="button" className={`btn ${mode === "mobile" ? "btn-primary" : "btn-line"}`} onClick={() => setMode("mobile")}>
              Mobile
            </button>
          </div>
          {mode === "email" ? (
            <label className="mt-4 block text-sm">
              Email
              <input className="field mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </label>
          ) : (
            <label className="mt-4 block text-sm">
              Mobile number
              <input className="field mt-1" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" placeholder="082 000 0000" />
            </label>
          )}
        </>
      )}
      {needAdult ? (
        <label className="mt-4 flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1" checked={over18} onChange={(e) => setOver18(e.target.checked)} />
          I am 18 or over.
        </label>
      ) : null}
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      <button className="btn btn-primary mt-5" type="submit" disabled={busy}>
        {busy ? "Saving…" : account ? "Continue" : "Create account"}
      </button>
    </form>
  );
}

export function SignedInLine() {
  const account = useShop((s) => s.account);
  const setAccount = useShop((s) => s.setAccount);
  if (!account) return null;
  return (
    <p className="mt-2 text-xs text-muted">
      Signed in as {account.name}.{" "}
      <button type="button" className="underline" onClick={() => setAccount(null)}>
        Sign out
      </button>
    </p>
  );
}
