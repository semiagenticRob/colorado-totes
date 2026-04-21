export const PALLET_SIZE = 120;

export function isReadyForPalletization(inBuildingCount: number): boolean {
  return inBuildingCount >= PALLET_SIZE;
}

export function palletizationProgressPct(inBuildingCount: number): number {
  return Math.min(100, Math.round((inBuildingCount / PALLET_SIZE) * 100));
}
