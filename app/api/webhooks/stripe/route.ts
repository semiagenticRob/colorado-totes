import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/billing/stripe";
import { env } from "@/lib/env";
import { supabaseAdmin } from "@/lib/db/client";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "no sig" }, { status: 400 });
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(body, sig, env().stripeWebhookSecret);
  } catch (err) {
    return NextResponse.json(
      { error: `webhook verify: ${(err as Error).message}` },
      { status: 400 },
    );
  }

  const db = supabaseAdmin();

  switch (event.type) {
    case "setup_intent.succeeded": {
      const si = event.data.object as Stripe.SetupIntent;
      const customerId = typeof si.customer === "string" ? si.customer : si.customer?.id;
      if (!customerId) break;
      const { data: building } = await db
        .from("buildings")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .maybeSingle();
      if (building) {
        const pm =
          typeof si.payment_method === "string" ? si.payment_method : si.payment_method?.id;
        if (pm) {
          await stripe().customers.update(customerId, {
            invoice_settings: { default_payment_method: pm },
          });
        }
        await db.from("buildings").update({ billing_status: "active" }).eq("id", building.id);
      }
      break;
    }
    case "invoice.paid": {
      const inv = event.data.object as Stripe.Invoice;
      await db
        .from("invoices")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("stripe_invoice_id", inv.id);
      const customerId = typeof inv.customer === "string" ? inv.customer : inv.customer?.id;
      if (customerId) {
        await db
          .from("buildings")
          .update({ billing_status: "active" })
          .eq("stripe_customer_id", customerId);
      }
      break;
    }
    case "invoice.payment_failed": {
      const inv = event.data.object as Stripe.Invoice;
      await db
        .from("invoices")
        .update({ status: "failed", failed_at: new Date().toISOString() })
        .eq("stripe_invoice_id", inv.id);
      const customerId = typeof inv.customer === "string" ? inv.customer : inv.customer?.id;
      if (customerId) {
        await db
          .from("buildings")
          .update({ billing_status: "delinquent" })
          .eq("stripe_customer_id", customerId);
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
