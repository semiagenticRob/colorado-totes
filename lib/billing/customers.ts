import { stripe } from "./stripe";
import { supabaseAdmin } from "@/lib/db/client";

export async function ensureStripeCustomerForBuilding(buildingId: string): Promise<string> {
  const db = supabaseAdmin();
  const { data: b, error } = await db
    .from("buildings")
    .select("id,name,stripe_customer_id")
    .eq("id", buildingId)
    .single();
  if (error) throw error;
  if (b.stripe_customer_id) return b.stripe_customer_id;

  const customer = await stripe().customers.create({
    name: b.name,
    metadata: { building_id: b.id },
  });
  await db.from("buildings").update({ stripe_customer_id: customer.id }).eq("id", buildingId);
  return customer.id;
}

export async function createSetupIntent(buildingId: string) {
  const customerId = await ensureStripeCustomerForBuilding(buildingId);
  return stripe().setupIntents.create({
    customer: customerId,
    payment_method_types: ["card"],
  });
}
