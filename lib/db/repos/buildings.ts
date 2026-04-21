import { supabaseAdmin } from "@/lib/db/client";
import type { Json } from "@/lib/db/types.generated";

export type NewBuilding = {
  company_id: string;
  name: string;
  address: string;
  recommended_batches_by_unit_type?: Record<string, number>;
  tenant_contact_info?: Json | null;
};

export async function createBuilding(input: NewBuilding) {
  const db = supabaseAdmin();
  const { data, error } = await db.from("buildings").insert(input).select("*").single();
  if (error) throw error;

  await db.from("tote_pools").insert([
    { building_id: data.id, location: "in_building" as const, count: 0 },
    { building_id: data.id, location: "at_3pl" as const, count: 0 },
    { building_id: data.id, location: "out_with_tenant" as const, count: 0 },
  ]);
  return data;
}

export async function listBuildingsForCompany(companyId: string) {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("buildings")
    .select("*")
    .eq("company_id", companyId)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getBuildingById(id: string) {
  const db = supabaseAdmin();
  const { data, error } = await db.from("buildings").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateBuilding(
  id: string,
  patch: Partial<{
    name: string;
    address: string;
    logo_storage_path: string | null;
    stripe_customer_id: string | null;
    billing_status: "setup_pending" | "active" | "delinquent";
    recommended_batches_by_unit_type: Record<string, number>;
    tenant_contact_info: Json | null;
  }>,
) {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("buildings")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}
