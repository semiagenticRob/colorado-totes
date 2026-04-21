import { describe, it, expect, beforeEach } from "vitest";
import { supabaseAdmin } from "@/lib/db/client";
import { createCompany, getCompanyBySlug, getCompanyById } from "@/lib/db/repos/companies";

beforeEach(async () => {
  const db = supabaseAdmin();
  await db.from("companies").delete().neq("id", "00000000-0000-0000-0000-000000000000");
});

describe("companies repo", () => {
  it("createCompany inserts and returns the row", async () => {
    const c = await createCompany({ name: "Acme", slug: "acme" });
    expect(c.name).toBe("Acme");
    expect(c.slug).toBe("acme");
  });
  it("getCompanyBySlug returns the row", async () => {
    await createCompany({ name: "Acme", slug: "acme" });
    const c = await getCompanyBySlug("acme");
    expect(c?.name).toBe("Acme");
  });
  it("getCompanyBySlug returns null when missing", async () => {
    expect(await getCompanyBySlug("nope")).toBeNull();
  });
  it("getCompanyById returns the row", async () => {
    const c = await createCompany({ name: "Acme", slug: "acme" });
    const got = await getCompanyById(c.id);
    expect(got?.id).toBe(c.id);
  });
});
