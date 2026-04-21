import Stripe from "stripe";
import { env } from "@/lib/env";

let _client: Stripe | null = null;
export function stripe(): Stripe {
  if (!_client) {
    _client = new Stripe(env().stripeSecretKey, { apiVersion: "2026-03-25.dahlia" });
  }
  return _client;
}
