import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/client";
import { env } from "@/lib/env";
import { sendTenantEmail } from "@/lib/email/send";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${env().cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const db = supabaseAdmin();
  const { data } = await db
    .from("tenant_emails")
    .select("id")
    .eq("status", "pending")
    .lte("scheduled_for", new Date().toISOString())
    .limit(100);

  const results: { id: string; ok: boolean; error?: string }[] = [];
  for (const row of data ?? []) {
    try {
      await sendTenantEmail(row.id);
      results.push({ id: row.id, ok: true });
    } catch (e) {
      results.push({ id: row.id, ok: false, error: (e as Error).message });
    }
  }
  return NextResponse.json({ processed: results.length, results });
}
