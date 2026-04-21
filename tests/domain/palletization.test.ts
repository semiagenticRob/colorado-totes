import { describe, it, expect } from "vitest";
import {
  PALLET_SIZE,
  isReadyForPalletization,
  palletizationProgressPct,
} from "@/lib/domain/palletization";

describe("palletization", () => {
  it("threshold is 120", () => {
    expect(PALLET_SIZE).toBe(120);
  });
  it("flags when in-building >= 120", () => {
    expect(isReadyForPalletization(119)).toBe(false);
    expect(isReadyForPalletization(120)).toBe(true);
    expect(isReadyForPalletization(240)).toBe(true);
  });
  it("progress pct caps at 100", () => {
    expect(palletizationProgressPct(60)).toBe(50);
    expect(palletizationProgressPct(120)).toBe(100);
    expect(palletizationProgressPct(240)).toBe(100);
  });
});
