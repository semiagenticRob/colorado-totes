"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { currentUser } from "@/lib/auth/current-user";
import { createMoveIn, markReturned } from "@/lib/db/repos/move-ins";

export async function createMoveInAction(formData: FormData) {
  const user = await currentUser();
  if (!user || !user.buildingId) redirect("/login");

  const phoneRaw = String(formData.get("tenant_phone") ?? "").trim();
  const mi = await createMoveIn({
    building_id: user.buildingId,
    tenant_name: String(formData.get("tenant_name")),
    tenant_email: String(formData.get("tenant_email")),
    tenant_phone: phoneRaw.length > 0 ? phoneRaw : null,
    unit_label: String(formData.get("unit_label")),
    unit_type: String(formData.get("unit_type")) as "studio" | "1br" | "2br" | "3br_plus" | "other",
    move_in_date: String(formData.get("move_in_date")),
    batch_count: Number(formData.get("batch_count")),
    created_by_user_id: user.id,
  });
  revalidatePath("/app/move-ins");
  redirect(`/app/move-ins/${mi.id}`);
}

export async function markReturnedAction(moveInId: string) {
  const user = await currentUser();
  if (!user) redirect("/login");
  await markReturned(moveInId, { actor_user_id: user.id });
  revalidatePath(`/app/move-ins/${moveInId}`);
}
