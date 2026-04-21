import { describe, it, expect } from "vitest";
import { isOverdue, daysOverdue } from "@/lib/domain/overdue";

describe("overdue", () => {
  const now = new Date("2026-04-21T12:00:00Z");
  it("not overdue if within threshold", () => {
    expect(isOverdue(new Date("2026-04-15T00:00:00Z"), 14, now)).toBe(false);
  });
  it("overdue if past threshold", () => {
    expect(isOverdue(new Date("2026-03-01T00:00:00Z"), 14, now)).toBe(true);
  });
  it("daysOverdue returns 0 when within threshold", () => {
    expect(daysOverdue(new Date("2026-04-20T00:00:00Z"), 14, now)).toBe(0);
  });
  it("daysOverdue returns positive days past threshold", () => {
    // delivered 20 days ago, threshold 14 → 6 days overdue
    const delivered = new Date("2026-04-01T12:00:00Z");
    expect(daysOverdue(delivered, 14, now)).toBe(6);
  });
});
