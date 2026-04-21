import { describe, it, expect, beforeEach } from "vitest";
import { supabaseAdmin } from "@/lib/db/client";
import { createCompany } from "@/lib/db/repos/companies";
import {
  createBuilding,
  listBuildingsForCompany,
  getBuildingById,
  updateBuilding,
} from "@/lib/db/repos/buildings";

async function reset() {
  const db = supabaseAdmin();
  await db.from("tote_pools").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("buildings").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("companies").delete().neq("id", "00000000-0000-0000-0000-000000000000");
}

describe("buildings repo", () => {
  beforeEach(reset);

  it("create + fetch + update + pools auto-init", async () => {
    const c = await createCompany({ name: "Acme", slug: "acme" });
    const b = await createBuilding({ company_id: c.id, name: "Sunrise", address: "123 Main" });
    expect(b.name).toBe("Sunrise");
    expect(b.billing_status).toBe("setup_pending");

    // Pools should be auto-initialized with zero counts
    const db = supabaseAdmin();
    const { data: pools } = await db.from("tote_pools").select("*").eq("building_id", b.id);
    expect(pools).toHaveLength(3);
    expect(pools!.every((p) => p.count === 0)).toBe(true);

    const list = await listBuildingsForCompany(c.id);
    expect(list).toHaveLength(1);

    const fetched = await getBuildingById(b.id);
    expect(fetched?.name).toBe("Sunrise");

    const updated = await updateBuilding(b.id, { address: "456 Elm" });
    expect(updated.address).toBe("456 Elm");
  });
});
