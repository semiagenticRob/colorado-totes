import { describe, it, expect } from "vitest";
import { aggregatePeriod, type CostLine } from "@/lib/domain/costs";

const line = (category: CostLine["category"], passthrough: number, markup: number): CostLine => ({
  category,
  passthroughCents: passthrough,
  markupCents: markup,
});

describe("cost aggregation", () => {
  it("rolls up per category and grand total", () => {
    const lines: CostLine[] = [
      line("delivery", 5000, 500),
      line("delivery", 6000, 600),
      line("pickup", 8000, 800),
      line("warehousing", 12000, 0),
      line("management_fee", 0, 2000),
      line("subscription", 0, 29900),
    ];
    const r = aggregatePeriod(lines);
    expect(r.passthroughCents).toBe(5000 + 6000 + 8000 + 12000);
    expect(r.markupCents).toBe(500 + 600 + 800 + 2000);
    expect(r.subscriptionCents).toBe(29900);
    expect(r.totalCents).toBe(5000 + 500 + 6000 + 600 + 8000 + 800 + 12000 + 2000 + 29900);
  });

  it("handles empty input", () => {
    const r = aggregatePeriod([]);
    expect(r.totalCents).toBe(0);
  });
});
