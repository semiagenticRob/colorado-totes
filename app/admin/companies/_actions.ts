"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { currentUser } from "@/lib/auth/current-user";
import { requireRole } from "@/lib/auth/guards";
import { createCompany } from "@/lib/db/repos/companies";

export async function createCompanyAction(formData: FormData) {
  const user = await currentUser();
  if (!user) redirect("/login");
  requireRole(user, ["totes_admin"]);

  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const overdueDays = Number(formData.get("overdue_days") ?? 14);
  if (!name || !slug) throw new Error("Name and slug required");

  const c = await createCompany({
    name,
    slug,
    settings: { overdue_days: overdueDays },
  });
  revalidatePath("/admin/companies");
  redirect(`/admin/companies/${c.id}`);
}

export async function createBuildingAction(companyId: string, formData: FormData) {
  const user = await currentUser();
  if (!user) redirect("/login");
  requireRole(user, ["totes_admin"]);

  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  if (!name || !address) throw new Error("Name and address required");

  const { createBuilding } = await import("@/lib/db/repos/buildings");
  const b = await createBuilding({ company_id: companyId, name, address });
  revalidatePath(`/admin/companies/${companyId}`);
  redirect(`/admin/companies/${companyId}/buildings/${b.id}`);
}

export async function recordAcquisitionAction(
  companyId: string,
  buildingId: string,
  formData: FormData,
) {
  const user = await currentUser();
  if (!user) redirect("/login");
  requireRole(user, ["totes_admin"]);
  const count = Number(formData.get("count"));
  const type = String(formData.get("type")) as "initial" | "reorder";
  if (!count || count <= 0) throw new Error("Count required");
  const { recordAcquisition } = await import("@/lib/db/repos/inventory");
  await recordAcquisition({
    building_id: buildingId,
    count,
    acquisition_type: type,
  });
  revalidatePath(`/admin/companies/${companyId}/buildings/${buildingId}`);
}

export async function inviteUserAction(companyId: string, formData: FormData) {
  const user = await currentUser();
  if (!user) redirect("/login");
  requireRole(user, ["totes_admin"]);

  const email = String(formData.get("email")).trim().toLowerCase();
  const role = String(formData.get("role")) as "pm_billing_admin" | "company_admin";
  const buildingIdRaw = String(formData.get("building_id") ?? "");
  const buildingId = buildingIdRaw.length > 0 ? buildingIdRaw : null;
  const { inviteUser } = await import("@/lib/db/repos/users");
  await inviteUser({
    email,
    role,
    company_id: companyId,
    building_id: role === "pm_billing_admin" ? buildingId : null,
    display_name: email,
  });
  revalidatePath(`/admin/companies/${companyId}/users`);
}
