import { Resend } from "resend";
import { render } from "@react-email/components";
import { env } from "@/lib/env";
import { supabaseAdmin } from "@/lib/db/client";
import { Scheduled } from "./templates/Scheduled";
import { Delivered } from "./templates/Delivered";
import { Reminder } from "./templates/Reminder";

let _resend: Resend | null = null;
function resend() {
  if (!_resend) _resend = new Resend(env().resendApiKey);
  return _resend;
}

async function publicLogoUrl(storagePath: string | null): Promise<string | undefined> {
  if (!storagePath) return undefined;
  const db = supabaseAdmin();
  const { data } = db.storage.from("logos").getPublicUrl(storagePath);
  return data.publicUrl;
}

export async function sendTenantEmail(rowId: string) {
  const db = supabaseAdmin();
  const { data: row, error } = await db
    .from("tenant_emails")
    .select("id,kind,move_in_id")
    .eq("id", rowId)
    .single();
  if (error) throw error;

  const { data: mi } = await db
    .from("move_ins")
    .select(
      "tenant_name,tenant_email,move_in_date,batch_count,buildings(name,logo_storage_path,tenant_contact_info)",
    )
    .eq("id", row.move_in_id)
    .single();
  if (!mi) throw new Error("move_in not found");

  const bRaw = mi.buildings;
  const b = (Array.isArray(bRaw) ? bRaw[0] : bRaw) as {
    name?: string;
    logo_storage_path?: string | null;
    tenant_contact_info?: { drop_off_location?: string; contact_email?: string } | null;
  } | null;

  const logoUrl = await publicLogoUrl(b?.logo_storage_path ?? null);
  const dropOff = b?.tenant_contact_info?.drop_off_location ?? "the building lobby";
  const contact = b?.tenant_contact_info?.contact_email ?? "concierge@building.com";
  const buildingName = b?.name ?? "your building";

  let subject: string;
  let html: string;
  let eventType: "email_scheduled_sent" | "email_delivered_sent" | "email_reminder_sent";

  switch (row.kind) {
    case "scheduled":
      subject = `Your ${buildingName} move-in totes are scheduled`;
      html = await render(
        Scheduled({
          tenantName: mi.tenant_name,
          buildingName,
          moveInDate: mi.move_in_date,
          batchCount: mi.batch_count,
          logoUrl,
        }),
      );
      eventType = "email_scheduled_sent";
      break;
    case "delivered":
      subject = `Your ${buildingName} totes have been delivered`;
      html = await render(
        Delivered({
          tenantName: mi.tenant_name,
          buildingName,
          dropOffLocation: dropOff,
          contactEmail: contact,
          logoUrl,
        }),
      );
      eventType = "email_delivered_sent";
      break;
    case "reminder_48h":
      subject = `Welcome to ${buildingName} — returning your totes`;
      html = await render(
        Reminder({
          tenantName: mi.tenant_name,
          buildingName,
          dropOffLocation: dropOff,
          contactEmail: contact,
          logoUrl,
        }),
      );
      eventType = "email_reminder_sent";
      break;
    default:
      throw new Error(`Unknown email kind: ${row.kind}`);
  }

  const sent = await resend().emails.send({
    from: env().resendFromAddress,
    to: mi.tenant_email,
    subject,
    html,
  });

  if (sent.error) {
    await db.from("tenant_emails").update({ status: "failed" }).eq("id", row.id);
    throw sent.error;
  }

  await db
    .from("tenant_emails")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      resend_message_id: sent.data?.id ?? null,
    })
    .eq("id", row.id);

  await db.from("move_in_events").insert({
    move_in_id: row.move_in_id,
    event_type: eventType,
    payload: { resend_message_id: sent.data?.id ?? null },
  });
}
