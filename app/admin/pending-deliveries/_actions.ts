"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth/current-user";
import { requireRole } from "@/lib/auth/guards";
import { markDelivered, getMoveInById } from "@/lib/db/repos/move-ins";
import { recordCostLineItem } from "@/lib/db/repos/billing";

export async function markDeliveredAction(moveInId: string, formData: FormData) {
  const user = await currentUser();
  if (!user) redirect("/login");
  requireRole(user, ["totes_admin"]);

  const passthrough = Math.round(Number(formData.get("passthrough")) * 100);
  const markup = Math.round(Number(formData.get("markup")) * 100);
  if (!passthrough && !markup) throw new Error("Enter passthrough or markup");

  const mi = await getMoveInById(moveInId);
  if (!mi) throw new Error("not found");

  await markDelivered(moveInId, { actor_user_id: user.id });
  await recordCostLineItem({
    building_id: mi.building_id,
    move_in_id: moveInId,
    category: "delivery",
    passthrough_cents: passthrough,
    markup_cents: markup,
    incurred_on: new Date().toISOString().slice(0, 10),
    entered_by_user_id: user.id,
  });
  revalidatePath("/admin/pending-deliveries");
}
