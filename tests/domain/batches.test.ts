import { describe, it, expect } from "vitest";
import { BATCH_SIZE, totesFromBatches, recommendedBatches } from "@/lib/domain/batches";

describe("batches", () => {
  it("BATCH_SIZE is 20", () => {
    expect(BATCH_SIZE).toBe(20);
  });
  it("totesFromBatches multiplies by 20", () => {
    expect(totesFromBatches(1)).toBe(20);
    expect(totesFromBatches(3)).toBe(60);
  });
  it("recommendedBatches looks up unit_type in settings map", () => {
    const map = { studio: 1, "1br": 2, "2br": 2, "3br_plus": 3, other: 1 };
    expect(recommendedBatches("studio", map)).toBe(1);
    expect(recommendedBatches("2br", map)).toBe(2);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(recommendedBatches("unknown" as any, map)).toBe(1); // falls back to "other"
  });
});
