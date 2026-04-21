const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysSince(deliveredAt: Date, now: Date): number {
  return Math.floor((now.getTime() - deliveredAt.getTime()) / MS_PER_DAY);
}

export function isOverdue(
  deliveredAt: Date,
  thresholdDays: number,
  now: Date = new Date(),
): boolean {
  return daysSince(deliveredAt, now) >= thresholdDays;
}

export function daysOverdue(
  deliveredAt: Date,
  thresholdDays: number,
  now: Date = new Date(),
): number {
  const d = daysSince(deliveredAt, now) - thresholdDays;
  return d > 0 ? d : 0;
}
