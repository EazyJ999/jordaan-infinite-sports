import { useEffect, useRef, useState, type FormEvent } from "react";
import { capturePayPalOrder, createPayPalOrder, paypalStatus, savePayPal } from "@/lib/paypal.functions";

type Paid = { id: string; subtotal: number; shipping: number; total: number; lines: unknown[] };

export function PayPalCheckout({
  onCollect,
  onPaid,
  onError,
}: {
  onCollect: () => unknown | null;
  onPaid: (order: Paid) => void;
  onError: (message: string) => void;
}) {
  const slot = useRef<HTMLDivElement>(null);
  const collectRef = useRef(onCollect);
  const paidRef = useRef(onPaid);
  const errorRef = useRef(onError);
  const [enabled, setEnabled] = useState<boolean | null>(null);

  collectRef.current = onCollect;
  paidRef.current = onPaid;
  errorRef.current = onError;

  useEffect(() => {
    let stop = false;
    paypalStatus()
      .then((status) => {
        if (stop) return;
        setEnabled(status.enabled);
        if (!status.enabled || !status.clientId || !slot.current) return;
        const script = document.createElement("script");
        script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(status.clientId)}&currency=ZAR&intent=capture`;
        script.async = true;
        script.onload = () => {
          const paypal = (window as unknown as { paypal?: { Buttons: (options: unknown) => { render: (node: HTMLElement) => Promise<void> } } }).paypal;
          if (!paypal || !slot.current) return;
          slot.current.innerHTML = "";
          void paypal
            .Buttons({
              style: { layout: "horizontal", color: "black", shape: "rect", label: "paypal" },
              createOrder: async () => {
                const payload = collectRef.current();
                if (!payload) throw new Error("Check the form.");
                const result = await createPayPalOrder({ data: payload });
                if (!result.ok || !("paypalId" in result)) throw new Error(result.ok ? "PayPal did not start." : result.error);
                return result.paypalId;
              },
              onApprove: async (data: { orderID: string }) => {
                const result = await capturePayPalOrder({ data: { paypalId: data.orderID } });
                if (!result.ok || !("id" in result) || !result.id) {
                  errorRef.current(result.ok ? "PayPal did not save the order." : result.error);
                  return;
                }
                paidRef.current(result);
              },
              onError: () => errorRef.current("PayPal could not finish. You can still send the order on WhatsApp."),
            })
            .render(slot.current);
        };
        document.body.appendChild(script);
      })
      .catch(() => {
        if (!stop) setEnabled(false);
      });
    return () => {
      stop = true;
    };
  }, []);

  if (enabled === false) {
    return (
      <p className="mt-3 max-w-md text-sm text-muted">
        PayPal is ready on this page once the live client ID and secret are saved on the admin desk.
      </p>
    );
  }

  return <div ref={slot} className="mt-3 max-w-sm" />;
}

export function PayPalAdmin() {
  const [clientId, setClientId] = useState("");
  const [secret, setSecret] = useState("");
  const [live, setLive] = useState(true);
  const [note, setNote] = useState("");

  async function save(event: FormEvent) {
    event.preventDefault();
    const result = await savePayPal({ data: { clientId, secret, live } });
    setNote(result.ok ? "PayPal is linked. Checkout can take payment." : result.error);
    if (result.ok) setSecret("");
  }

  return (
    <form onSubmit={(event) => void save(event)} className="mt-8 max-w-lg border border-line bg-paper px-4 py-5">
      <h2 className="text-2xl uppercase">PayPal</h2>
      <p className="mt-2 text-sm text-muted">
        Paste the live client ID and secret from your PayPal business app. Checkout then takes the bag total in Rand. The secret is not shown on the shop.
      </p>
      <label className="mt-4 block text-sm">
        Client ID
        <input className="field mt-1" value={clientId} onChange={(event) => setClientId(event.target.value)} autoComplete="off" />
      </label>
      <label className="mt-3 block text-sm">
        Secret
        <input className="field mt-1" value={secret} onChange={(event) => setSecret(event.target.value)} type="password" autoComplete="off" />
      </label>
      <label className="mt-3 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={live} onChange={(event) => setLive(event.target.checked)} />
        Live business account
      </label>
      {note ? <p className="mt-3 text-sm">{note}</p> : null}
      <button className="btn btn-ink mt-4" type="submit">
        Link PayPal
      </button>
    </form>
  );
}
