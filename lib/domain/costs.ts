export type CostCategory =
  | "delivery"
  | "pickup"
  | "warehousing"
  | "management_fee"
  | "subscription";

export type CostLine = {
  category: CostCategory;
  passthroughCents: number;
  markupCents: number;
};

export type PeriodRollup = {
  passthroughCents: number;
  markupCents: number;
  subscriptionCents: number;
  totalCents: number;
};

export function aggregatePeriod(lines: CostLine[]): PeriodRollup {
  let passthroughCents = 0;
  let markupCents = 0;
  let subscriptionCents = 0;
  let totalCents = 0;
  for (const l of lines) {
    if (l.category === "subscription") {
      subscriptionCents += l.passthroughCents + l.markupCents;
    } else {
      passthroughCents += l.passthroughCents;
      markupCents += l.markupCents;
    }
    totalCents += l.passthroughCents + l.markupCents;
  }
  return { passthroughCents, markupCents, subscriptionCents, totalCents };
}
