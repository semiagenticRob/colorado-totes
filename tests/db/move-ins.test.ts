import { describe, it, expect, beforeEach } from "vitest";
import { supabaseAdmin } from "@/lib/db/client";
import { createCompany } from "@/lib/db/repos/companies";
import { createBuilding } from "@/lib/db/repos/buildings";
import {
  createMoveIn,
  markDelivered,
  markReturned,
  getMoveInById,
  listMoveInEvents,
} from "@/lib/db/repos/move-ins";

async function reset() {
  const db = supabaseAdmin();
  await db.from("tenant_emails").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("move_in_events").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("move_ins").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("tote_pools").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("buildings").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("companies").delete().neq("id", "00000000-0000-0000-0000-000000000000");
}

describe("move-ins repo", () => {
  beforeEach(reset);

  async function seed() {
    const c = await createCompany({ name: "Acme", slug: "acme" });
    const b = await createBuilding({ company_id: c.id, name: "Sunrise", address: "x" });
    await supabaseAdmin()
      .from("tote_pools")
      .update({ count: 100 })
      .eq("building_id", b.id)
      .eq("location", "at_3pl");
    return { c, b };
  }

  it("create → delivered → returned transitions pools and logs events", async () => {
    const { b } = await seed();

    const mi = await createMoveIn({
      building_id: b.id,
      tenant_name: "Jane",
      tenant_email: "jane@example.com",
      unit_label: "4B",
      unit_type: "2br",
      move_in_date: "2026-05-01",
      batch_count: 2,
    });
    expect(mi.state).toBe("pending_delivery");

    let events = await listMoveInEvents(mi.id);
    expect(events.map((e) => e.event_type)).toContain("created");

    await markDelivered(mi.id);
    const afterDelivery = await getMoveInById(mi.id);
    expect(afterDelivery?.state).toBe("delivered");

    const { data: pools } = await supabaseAdmin()
      .from("tote_pools")
      .select("location,count")
      .eq("building_id", b.id);
    const pmap = Object.fromEntries(pools!.map((p) => [p.location, p.count]));
    expect(pmap.at_3pl).toBe(60);
    expect(pmap.out_with_tenant).toBe(40);

    await markReturned(mi.id);
    const afterReturn = await getMoveInById(mi.id);
    expect(afterReturn?.state).toBe("returned");
    const { data: pools2 } = await supabaseAdmin()
      .from("tote_pools")
      .select("location,count")
      .eq("building_id", b.id);
    const p2 = Object.fromEntries(pools2!.map((p) => [p.location, p.count]));
    expect(p2.out_with_tenant).toBe(0);
    expect(p2.in_building).toBe(40);

    events = await listMoveInEvents(mi.id);
    const types = events.map((e) => e.event_type);
    expect(types).toEqual(expect.arrayContaining(["created", "delivered", "returned"]));

    const { data: emails } = await supabaseAdmin()
      .from("tenant_emails")
      .select("kind")
      .eq("move_in_id", mi.id);
    expect(emails?.map((e) => e.kind)).toEqual(
      expect.arrayContaining(["scheduled", "delivered", "reminder_48h"]),
    );
  });
});
