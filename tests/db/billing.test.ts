import { describe, it, expect, beforeEach } from "vitest";
import { supabaseAdmin } from "@/lib/db/client";
import { createCompany } from "@/lib/db/repos/companies";
import { createBuilding } from "@/lib/db/repos/buildings";
import {
  recordCostLineItem,
  listLineItemsForBuilding,
  billingPeriodFromDate,
  listInvoicesForBuilding,
} from "@/lib/db/repos/billing";

async function reset() {
  const db = supabaseAdmin();
  await db.from("cost_line_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("invoices").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("tote_pools").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("buildings").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("companies").delete().neq("id", "00000000-0000-0000-0000-000000000000");
}

describe("billing repo", () => {
  beforeEach(reset);

  it("billingPeriodFromDate returns first-of-month", () => {
    expect(billingPeriodFromDate("2026-04-15")).toBe("2026-04-01");
  });

  it("record + list cost line items", async () => {
    const c = await createCompany({ name: "A", slug: "a" });
    const b = await createBuilding({ company_id: c.id, name: "S", address: "x" });
    await recordCostLineItem({
      building_id: b.id,
      category: "delivery",
      passthrough_cents: 5000,
      markup_cents: 500,
      incurred_on: "2026-04-15",
    });
    const lines = await listLineItemsForBuilding(b.id, "2026-04-01");
    expect(lines).toHaveLength(1);
    expect(lines[0].total_cents).toBe(5500);
  });

  it("listInvoicesForBuilding returns rows in reverse billing period order", async () => {
    const c = await createCompany({ name: "A", slug: "a" });
    const b = await createBuilding({ company_id: c.id, name: "S", address: "x" });
    const invoices = await listInvoicesForBuilding(b.id);
    expect(invoices).toHaveLength(0); // no invoices yet
  });
});
