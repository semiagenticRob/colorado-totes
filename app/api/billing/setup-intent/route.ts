import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth/current-user";
import { createSetupIntent } from "@/lib/billing/customers";

export async function POST() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (user.role !== "pm_billing_admin" && user.role !== "company_admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (!user.buildingId) {
    return NextResponse.json({ error: "no building context" }, { status: 400 });
  }
  const si = await createSetupIntent(user.buildingId);
  return NextResponse.json({ clientSecret: si.client_secret });
}
