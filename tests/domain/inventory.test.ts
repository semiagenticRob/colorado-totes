import { describe, it, expect } from "vitest";
import { applyDelta, type Pools } from "@/lib/domain/inventory";

const pools = (inB: number, at3: number, out: number): Pools => ({
  in_building: inB,
  at_3pl: at3,
  out_with_tenant: out,
});

describe("inventory delta", () => {
  it("delivery moves totes from at_3pl to out_with_tenant", () => {
    const p = pools(0, 100, 0);
    const r = applyDelta(p, { kind: "delivery", totes: 40 });
    expect(r).toEqual(pools(0, 60, 40));
  });
  it("return moves totes from out_with_tenant to in_building", () => {
    const p = pools(200, 0, 40);
    const r = applyDelta(p, { kind: "return", totes: 40 });
    expect(r).toEqual(pools(240, 0, 0));
  });
  it("pickup moves totes from in_building to at_3pl", () => {
    const p = pools(120, 0, 0);
    const r = applyDelta(p, { kind: "pickup", totes: 120 });
    expect(r).toEqual(pools(0, 120, 0));
  });
  it("acquisition adds to a specified pool", () => {
    const p = pools(0, 0, 0);
    expect(applyDelta(p, { kind: "acquisition", into: "in_building", totes: 200 })).toEqual(
      pools(200, 0, 0),
    );
  });
  it("throws when source pool would go negative", () => {
    const p = pools(0, 10, 0);
    expect(() => applyDelta(p, { kind: "delivery", totes: 40 })).toThrow();
  });
});
