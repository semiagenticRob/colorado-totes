import { supabaseAdmin } from "@/lib/db/client";

export async function getPoolsForBuilding(buildingId: string) {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("tote_pools")
    .select("location,count")
    .eq("building_id", buildingId);
  if (error) throw error;
  const out = { in_building: 0, at_3pl: 0, out_with_tenant: 0 };
  for (const row of data ?? []) (out as Record<string, number>)[row.location] = row.count;
  return out;
}

export async function reportLoss(input: {
  building_id: string;
  count: number;
  reason: "lost" | "damaged" | "decommissioned";
  reported_by_user_id?: string | null;
  notes?: string | null;
}) {
  const db = supabaseAdmin();
  const { data, error } = await db.from("tote_losses").insert(input).select("*").single();
  if (error) throw error;
  return data;
}

export async function listLosses(buildingId: string) {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("tote_losses")
    .select("*")
    .eq("building_id", buildingId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function recordAcquisition(input: {
  building_id: string;
  count: number;
  acquisition_type: "initial" | "reorder";
  notes?: string | null;
}) {
  const db = supabaseAdmin();
  const { data, error } = await db.from("tote_acquisitions").insert(input).select("*").single();
  if (error) throw error;
  await db.rpc("increment_pool", {
    p_building_id: input.building_id,
    p_location: "in_building",
    p_amount: input.count,
  });
  return data;
}

export async function listAcquisitions(buildingId: string) {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("tote_acquisitions")
    .select("*")
    .eq("building_id", buildingId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
