import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/billing/stripe", () => ({
  stripe: () => ({
    customers: {
      create: vi.fn().mockResolvedValue({ id: "cus_test_123" }),
    },
    setupIntents: {
      create: vi.fn().mockResolvedValue({ id: "seti_test_123", client_secret: "cs_x" }),
    },
  }),
}));

import { ensureStripeCustomerForBuilding, createSetupIntent } from "@/lib/billing/customers";
import { supabaseAdmin } from "@/lib/db/client";
import { createCompany } from "@/lib/db/repos/companies";
import { createBuilding } from "@/lib/db/repos/buildings";

beforeEach(async () => {
  const db = supabaseAdmin();
  await db.from("tote_pools").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("buildings").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("companies").delete().neq("id", "00000000-0000-0000-0000-000000000000");
});

describe("stripe customer provisioning", () => {
  it("creates and caches a Stripe Customer", async () => {
    const c = await createCompany({ name: "A", slug: "a" });
    const b = await createBuilding({ company_id: c.id, name: "S", address: "x" });
    const id = await ensureStripeCustomerForBuilding(b.id);
    expect(id).toBe("cus_test_123");
    const again = await ensureStripeCustomerForBuilding(b.id);
    expect(again).toBe("cus_test_123");
  });

  it("creates a SetupIntent", async () => {
    const c = await createCompany({ name: "A", slug: "a" });
    const b = await createBuilding({ company_id: c.id, name: "S", address: "x" });
    const si = await createSetupIntent(b.id);
    expect(si.client_secret).toBeDefined();
  });
});
