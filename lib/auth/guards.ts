import type { AuthUser } from "./current-user";

export function requireRole(user: AuthUser, allowed: AuthUser["role"][]): void {
  if (!allowed.includes(user.role)) {
    throw new Error(`Forbidden: requires one of ${allowed.join(", ")}`);
  }
}

export function canActOnBuilding(
  user: AuthUser,
  buildingId: string,
  buildingToCompany?: Record<string, string>,
): boolean {
  if (user.role === "totes_admin") return true;
  if (user.role === "pm_billing_admin") return user.buildingId === buildingId;
  if (user.role === "company_admin") {
    if (!buildingToCompany) return false;
    return buildingToCompany[buildingId] === user.companyId;
  }
  return false;
}
