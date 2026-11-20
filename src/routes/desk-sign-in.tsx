import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/desk-sign-in")({
  head: () => ({ meta: [{ title: "Admin · J.I.S" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return (
      <main className="mx-auto grid min-h-[60vh] max-w-md place-items-center px-4">
        <p className="text-sm uppercase tracking-widest text-muted">Checking sign-in…</p>
      </main>
    );
  }
  if (user) return <Navigate to="/desk" />;
  return <LoginForm />;
}

function LoginForm() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!email.includes("@")) {
      setError("Add the email for this desk.");
      return;
    }
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (mode === "up" && name.trim().length < 2) {
      setError("Add your name.");
      return;
    }
    setBusy(true);
    try {
      const result =
        mode === "up"
          ? await authClient.signUp.email({
              name: name.trim(),
              email: email.trim(),
              password,
              callbackURL: "/desk",
            })
          : await authClient.signIn.email({
              email: email.trim(),
              password,
              callbackURL: "/desk",
            });
      if (result.error) {
        setError(result.error.message || "That login did not work.");
        setBusy(false);
        return;
      }
      window.location.assign("/desk");
    } catch (err) {
      setError(err instanceof Error ? err.message : "That login did not work.");
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-4 py-12">
      <div className="w-full border border-line bg-paper px-5 py-6">
        <p className="text-xs uppercase tracking-widest text-brass">Admin</p>
        <h1 className="mt-2 text-5xl uppercase leading-none">{mode === "up" ? "Create admin" : "Admin sign in"}</h1>
        <p className="mt-3 text-sm text-muted">
          Only you use this. Pictures, descriptions and prices you save here show on the shop straight away.
        </p>

        {!authEnabled ? (
          <p className="mt-6 text-sm text-muted">Sign-in is not switched on yet.</p>
        ) : (
          <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
            {mode === "up" ? (
              <label className="block text-sm">
                Your name
                <input className="field mt-1" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
              </label>
            ) : null}
            <label className="block text-sm">
              Email
              <input
                className="field mt-1"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </label>
            <label className="block text-sm">
              Password
              <input
                className="field mt-1"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "up" ? "new-password" : "current-password"}
                required
              />
            </label>
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <button className="btn btn-primary mt-2" type="submit" disabled={busy}>
              {busy ? "One moment…" : mode === "up" ? "Create admin login" : "Sign in"}
            </button>
            <button
              type="button"
              className="text-sm underline"
              onClick={() => {
                setMode(mode === "up" ? "in" : "up");
                setError("");
              }}
            >
              {mode === "up" ? "I already have a login" : "First time — create the admin login"}
            </button>
          </form>
        )}

        {authEnabled && GROK_PROVIDERS.length > 0 ? (
          <div className="mt-6 border-t border-line pt-4">
            <p className="text-xs uppercase tracking-widest text-muted">Or</p>
            <div className="mt-3 flex flex-col gap-2">
              {GROK_PROVIDERS.map((provider) => (
                <button
                  key={provider.providerId}
                  type="button"
                  className="btn btn-line w-full"
                  onClick={() => void signIn(provider.providerId, { callbackURL: "/desk" })}
                >
                  Continue with {provider.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
