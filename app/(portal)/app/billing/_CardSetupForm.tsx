"use client";

import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export function CardSetupForm() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/billing/setup-intent", { method: "POST" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`Failed to start setup: ${r.status}`);
        return r.json();
      })
      .then((d) => setClientSecret(d.clientSecret))
      .catch((e) => setErr(e.message));
  }, []);

  if (err) return <p className="text-red-600 text-sm">{err}</p>;
  if (!clientSecret) return <p>Loading…</p>;

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <InnerForm />
    </Elements>
  );
}

function InnerForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setErr(null);
    const { error } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/app/billing?setup=complete`,
      },
    });
    if (error) setErr(error.message ?? "Setup failed");
    setLoading(false);
  }

  return (
    <form onSubmit={submit} className="space-y-4 max-w-md">
      <PaymentElement />
      {err && <p className="text-red-600 text-sm">{err}</p>}
      <button
        className="bg-black text-white rounded px-3 py-2 disabled:opacity-50"
        disabled={!stripe || loading}
      >
        {loading ? "Saving…" : "Save payment method"}
      </button>
    </form>
  );
}
