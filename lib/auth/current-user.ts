import { supabaseServer } from "@/lib/db/client";

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

  // Custom claims from our JWT hook land on app_metadata in the session claims,
  // but the supabase-js client parses them onto user.app_metadata for server side.
  // Check both locations defensively.
  const meta = (user.app_metadata ?? {}) as Record<string, unknown>;
  const userMeta = (user.user_metadata ?? {}) as Record<string, unknown>;

  const role = (meta.user_role ?? userMeta.user_role) as AuthUser["role"] | undefined;
  if (!role) return null;

  const companyId = (meta.company_id ?? userMeta.company_id) as string | undefined;
  const buildingId = (meta.building_id ?? userMeta.building_id) as string | undefined;

  return {
    id: user.id,
    email: user.email!,
    role,
    companyId: companyId && companyId.length > 0 ? companyId : null,
    buildingId: buildingId && buildingId.length > 0 ? buildingId : null,
  };
}
