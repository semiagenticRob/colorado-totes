import { describe, it, expect, beforeEach } from "vitest";
import { supabaseAdmin } from "@/lib/db/client";
import { createCompany } from "@/lib/db/repos/companies";
import { createBuilding } from "@/lib/db/repos/buildings";
import { inviteUser, getUserById, listUsersForCompany } from "@/lib/db/repos/users";

async function reset() {
  const db = supabaseAdmin();
  await db.from("users").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("tote_pools").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("buildings").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("companies").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  const { data: list } = await db.auth.admin.listUsers();
  for (const u of list?.users ?? []) await db.auth.admin.deleteUser(u.id);
}

describe("users repo", () => {
  beforeEach(reset);

  it("invites a pm_billing_admin scoped to a building", async () => {
    const c = await createCompany({ name: "Acme", slug: "acme" });
    const b = await createBuilding({ company_id: c.id, name: "Sunrise", address: "x" });
    const u = await inviteUser({
      email: "pm@example.com",
      role: "pm_billing_admin",
      company_id: c.id,
      building_id: b.id,
      display_name: "PM One",
    });
    expect(u.email).toBe("pm@example.com");
    expect(u.role).toBe("pm_billing_admin");
    expect(u.building_id).toBe(b.id);

    const fetched = await getUserById(u.id);
    expect(fetched?.email).toBe("pm@example.com");

    const listed = await listUsersForCompany(c.id);
    expect(listed).toHaveLength(1);
  });
});
