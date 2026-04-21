import { supabaseAdmin } from "@/lib/db/client";
import { env } from "@/lib/env";

export type InviteInput = {
  email: string;
  role: "pm_billing_admin" | "company_admin" | "totes_admin";
  company_id: string | null;
  building_id: string | null;
  display_name?: string;
};

export async function inviteUser(input: InviteInput) {
  const db = supabaseAdmin();
  const { data: invited, error: inviteErr } = await db.auth.admin.inviteUserByEmail(input.email, {
    redirectTo: `${env().appBaseUrl}/invite/accept`,
  });
  if (inviteErr) throw inviteErr;
  const authUserId = invited.user!.id;

  const { data, error } = await db
    .from("users")
    .insert({
      id: authUserId,
      role: input.role,
      company_id: input.company_id,
      building_id: input.building_id,
      display_name: input.display_name ?? null,
      email: input.email,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function getUserById(id: string) {
  const db = supabaseAdmin();
  const { data, error } = await db.from("users").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function listUsersForCompany(companyId: string) {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("users")
    .select("*")
    .eq("company_id", companyId)
    .order("email");
  if (error) throw error;
  return data ?? [];
}
