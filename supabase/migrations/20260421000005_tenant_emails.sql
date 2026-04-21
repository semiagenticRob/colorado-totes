create type tenant_email_kind as enum ('scheduled', 'delivered', 'reminder_48h');
create type tenant_email_status as enum ('pending', 'sent', 'failed', 'bounced');

create table tenant_emails (
  id uuid primary key default gen_random_uuid(),
  move_in_id uuid not null references move_ins(id) on delete cascade,
  kind tenant_email_kind not null,
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  resend_message_id text,
  status tenant_email_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tenant_emails_pending_idx
  on tenant_emails(scheduled_for) where status = 'pending';
create index tenant_emails_move_in_id_idx on tenant_emails(move_in_id);
