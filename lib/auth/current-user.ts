import { supabaseAdmin, supabaseServer } from "@/lib/db/client";

export type AuthUser = {
  id: string;
  email: string;
  role: "pm_billing_admin" | "company_admin" | "totes_admin";
  companyId: string | null;
  buildingId: string | null;
};

export async function currentUser(): Promise<AuthUser | null> {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // The JWT hook injects user_role/company_id/building_id as top-level claims,
  // but supabase.auth.getUser() doesn't expose those. Look up the public.users
  // row directly using the service-role client (bypasses RLS).
  const { data: row } = await supabaseAdmin()
    .from("users")
    .select("role,company_id,building_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!row) return null;

  return {
    id: user.id,
    email: user.email!,
    role: row.role,
    companyId: row.company_id,
    buildingId: row.building_id,
  };
}
