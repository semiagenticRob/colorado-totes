import { describe, it, expect, beforeEach } from "vitest";
import { supabaseAdmin } from "@/lib/db/client";
import { createCompany } from "@/lib/db/repos/companies";
import { createBuilding } from "@/lib/db/repos/buildings";
import {
  getPoolsForBuilding,
  reportLoss,
  listLosses,
  recordAcquisition,
  listAcquisitions,
} from "@/lib/db/repos/inventory";

async function reset() {
  const db = supabaseAdmin();
  await db.from("tote_losses").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("tote_acquisitions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("tote_pools").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("buildings").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("companies").delete().neq("id", "00000000-0000-0000-0000-000000000000");
}

describe("inventory repo", () => {
  beforeEach(reset);
  it("report loss + list", async () => {
    const c = await createCompany({ name: "A", slug: "a" });
    const b = await createBuilding({ company_id: c.id, name: "S", address: "x" });
    await reportLoss({ building_id: b.id, count: 3, reason: "damaged" });
    const losses = await listLosses(b.id);
    expect(losses).toHaveLength(1);
    expect(losses[0].count).toBe(3);
  });
  it("acquisition increments in_building pool", async () => {
    const c = await createCompany({ name: "A", slug: "a" });
    const b = await createBuilding({ company_id: c.id, name: "S", address: "x" });
    await recordAcquisition({ building_id: b.id, count: 200, acquisition_type: "initial" });
    const pools = await getPoolsForBuilding(b.id);
    expect(pools.in_building).toBe(200);
    const acqs = await listAcquisitions(b.id);
    expect(acqs).toHaveLength(1);
  });
});
