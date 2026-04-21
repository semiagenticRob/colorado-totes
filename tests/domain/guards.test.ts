import { describe, it, expect } from "vitest";
import { requireRole, canActOnBuilding } from "@/lib/auth/guards";
import type { AuthUser } from "@/lib/auth/current-user";

const user = (partial: Partial<AuthUser>): AuthUser => ({
  id: "u1",
  email: "u@example.com",
  role: "pm_billing_admin",
  companyId: null,
  buildingId: null,
  ...partial,
});

describe("guards", () => {
  it("requireRole allows matching role", () => {
    expect(() =>
      requireRole(user({ role: "pm_billing_admin" }), ["pm_billing_admin"]),
    ).not.toThrow();
  });

  it("requireRole throws on mismatched role", () => {
    expect(() => requireRole(user({ role: "pm_billing_admin" }), ["company_admin"])).toThrow();
  });

  it("canActOnBuilding: totes_admin can always act", () => {
    expect(canActOnBuilding(user({ role: "totes_admin" }), "any-building-id")).toBe(true);
  });

  it("canActOnBuilding: pm scoped to building", () => {
    const u = user({ role: "pm_billing_admin", buildingId: "b1" });
    expect(canActOnBuilding(u, "b1")).toBe(true);
    expect(canActOnBuilding(u, "b2")).toBe(false);
  });

  it("canActOnBuilding: company_admin scoped via building lookup", () => {
    const u = user({ role: "company_admin", companyId: "c1" });
    expect(canActOnBuilding(u, "b1", { b1: "c1", b2: "c2" })).toBe(true);
    expect(canActOnBuilding(u, "b2", { b1: "c1", b2: "c2" })).toBe(false);
  });

  it("canActOnBuilding: company_admin without building→company map returns false", () => {
    const u = user({ role: "company_admin", companyId: "c1" });
    expect(canActOnBuilding(u, "b1")).toBe(false);
  });
});
