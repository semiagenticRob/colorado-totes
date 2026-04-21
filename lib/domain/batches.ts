export const BATCH_SIZE = 20;

export function totesFromBatches(n: number): number {
  return n * BATCH_SIZE;
}

export type UnitType = "studio" | "1br" | "2br" | "3br_plus" | "other";
export type RecommendationMap = Record<UnitType, number>;

export function recommendedBatches(unitType: UnitType, map: RecommendationMap): number {
  return map[unitType] ?? map.other ?? 1;
}
