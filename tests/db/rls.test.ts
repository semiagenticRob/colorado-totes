import { describe, it, expect, beforeAll } from "vitest";
import { supabaseAdmin } from "@/lib/db/client";
import { createCompany } from "@/lib/db/repos/companies";
import { createBuilding } from "@/lib/db/repos/buildings";
import { anonClientWithJwt, signInAs } from "../helpers/jwt";

async function reset() {
  const db = supabaseAdmin();
  await db.from("buildings").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("tote_pools").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("companies").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("users").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  const { data } = await db.auth.admin.listUsers();
  for (const u of data?.users ?? []) await db.auth.admin.deleteUser(u.id);
}

async function createUserWithPassword(
  email: string,
  password: string,
  row: {
    role: "pm_billing_admin" | "company_admin" | "totes_admin";
    company_id: string | null;
    building_id: string | null;
  },
): Promise<string> {
  const db = supabaseAdmin();
  const { data, error } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  await db.from("users").insert({
    id: data.user!.id,
    email,
    display_name: email,
    role: row.role,
    company_id: row.company_id,
    building_id: row.building_id,
  });
  return data.user!.id;
}

describe("RLS policies", () => {
  beforeAll(reset);

  it("pm_billing_admin only sees their own building", async () => {
    const c = await createCompany({ name: "Acme", slug: "acme-pm" });
    const b1 = await createBuilding({ company_id: c.id, name: "One", address: "x" });
    const b2 = await createBuilding({ company_id: c.id, name: "Two", address: "y" });

    await createUserWithPassword("pm-rls@example.com", "password123!", {
      role: "pm_billing_admin",
      company_id: c.id,
      building_id: b1.id,
    });

    const jwt = await signInAs("pm-rls@example.com", "password123!");
    const client = anonClientWithJwt(jwt);

    const { data } = await client.from("buildings").select("id");
    const ids = (data ?? []).map((r) => r.id);
    expect(ids).toContain(b1.id);
    expect(ids).not.toContain(b2.id);
  });

  it("company_admin sees all buildings in company but not another company's", async () => {
    const c1 = await createCompany({ name: "C1", slug: "c1" });
    const c2 = await createCompany({ name: "C2", slug: "c2" });
    const b1 = await createBuilding({ company_id: c1.id, name: "C1B1", address: "x" });
    const b2 = await createBuilding({ company_id: c2.id, name: "C2B1", address: "x" });

    await createUserWithPassword("co-rls@example.com", "password123!", {
      role: "company_admin",
      company_id: c1.id,
      building_id: null,
    });

    const jwt = await signInAs("co-rls@example.com", "password123!");
    const client = anonClientWithJwt(jwt);

    const { data } = await client.from("buildings").select("id");
    const ids = (data ?? []).map((r) => r.id);
    expect(ids).toContain(b1.id);
    expect(ids).not.toContain(b2.id);
  });
});
