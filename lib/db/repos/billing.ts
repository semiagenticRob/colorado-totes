import { supabaseAdmin } from "@/lib/db/client";

export function billingPeriodFromDate(isoDate: string): string {
  return `${isoDate.slice(0, 7)}-01`;
}

export async function recordCostLineItem(input: {
  building_id: string;
  move_in_id?: string | null;
  category: "delivery" | "pickup" | "warehousing" | "management_fee" | "subscription";
  passthrough_cents: number;
  markup_cents: number;
  incurred_on: string;
  entered_by_user_id?: string | null;
}) {
  const db = supabaseAdmin();
  const billing_period = billingPeriodFromDate(input.incurred_on);
  const { data, error } = await db
    .from("cost_line_items")
    .insert({ ...input, billing_period })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function listLineItemsForBuilding(buildingId: string, billingPeriod: string) {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("cost_line_items")
    .select("*")
    .eq("building_id", buildingId)
    .eq("billing_period", billingPeriod)
    .order("incurred_on", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listInvoicesForBuilding(buildingId: string) {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("invoices")
    .select("*")
    .eq("building_id", buildingId)
    .order("billing_period", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
