import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { SHOP_FULL } from "@/data/catalog";
import { sendBulkEnquiry } from "@/lib/orders.functions";
import { WHATSAPP_DISPLAY, whatsAppUrl } from "@/lib/whatsapp-order";

export const Route = createFileRoute("/bulk")({
  head: () => ({ meta: [{ title: "Bulk orders · J.I.S" }] }),
  component: BulkPage,
});

function BulkPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const popup = window.open("about:blank", "_blank");
    try {
      const result = await sendBulkEnquiry({ data: { name, phone, email, organisation, details } });
      if (!result.ok) {
        popup?.close();
        setError(result.error);
        return;
      }
      const text = [
        `${SHOP_FULL} bulk enquiry ${result.id}`,
        `Name: ${name.trim()}`,
        `Phone: ${phone.trim()}`,
        email.trim() ? `Email: ${email.trim()}` : "",
        organisation.trim() ? `Club / school: ${organisation.trim()}` : "",
        "",
        details.trim(),
      ]
        .filter((line) => line !== "")
        .join("\n");
      const url = whatsAppUrl(text);
      if (popup) popup.location.href = url;
      setSent(result.id);
    } catch (err) {
      popup?.close();
      setError(err instanceof Error ? err.message : "Could not send that.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-xs uppercase tracking-widest text-brass">Teams, schools and clubs</p>
      <h1 className="mt-2 text-5xl uppercase">Bulk orders</h1>
      <p className="mt-3 max-w-xl text-sm text-muted">
        Tell us the kits, sizes and quantities. The prices in the shop are for those items only. A bulk order is priced once we receive the request, then confirmed on WhatsApp to {WHATSAPP_DISPLAY}.
      </p>
      {sent ? (
        <div className="mt-8 border border-line bg-paper p-5">
          <h2 className="text-3xl uppercase">Enquiry {sent}</h2>
          <p className="mt-2 text-sm">If WhatsApp did not open, send the same details to {WHATSAPP_DISPLAY} and quote this code.</p>
        </div>
      ) : (
        <form onSubmit={(event) => void submit(event)} className="mt-8 grid gap-4">
          <label className="text-sm">
            Name
            <input className="field mt-1" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm">
              WhatsApp number
              <input className="field mt-1" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" inputMode="tel" required />
            </label>
            <label className="text-sm">
              Email (optional)
              <input className="field mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </label>
          </div>
          <label className="text-sm">
            Club, school or company
            <input className="field mt-1" value={organisation} onChange={(e) => setOrganisation(e.target.value)} />
          </label>
          <label className="text-sm">
            What you need
            <textarea
              className="field mt-1 min-h-40 py-3"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Example: 20 home shirts, 12 M, 6 L, 2 XL, names and numbers, needed by 20 March."
              required
            />
          </label>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <button className="btn btn-primary w-full sm:w-auto" type="submit" disabled={busy}>
            {busy ? "Sending…" : "Send on WhatsApp"}
          </button>
        </form>
      )}
    </main>
  );
}
