-- Outbound emails sent to customers, surfaced in the WEB conversation inbox
-- alongside SMS/WhatsApp. Kept in a SEPARATE table (not `messages`) so the
-- mobile app — which reads only `messages` — is completely unaffected.
-- Inbound email replies are NOT captured (they land in the mailbox, not here),
-- so every row here is direction = outbound.

create table if not exists customer_emails (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete cascade,
  conversation_id uuid references conversations(id) on delete set null,
  to_email text not null,
  from_email text,
  subject text,
  preview text,                                -- plaintext snippet of the body
  status text,                                 -- sent | failed
  resend_id text,                              -- Resend message id (idempotency / trace)
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists customer_emails_customer_idx on customer_emails (customer_id, created_at desc);
create index if not exists customer_emails_conversation_idx on customer_emails (conversation_id, created_at desc);

alter table customer_emails enable row level security;

-- Logged-in admins may read (needed for Supabase Realtime in the dashboard).
-- Writes happen server-side via the service role, which bypasses RLS.
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'customer_emails' and policyname = 'authenticated read customer_emails') then
    create policy "authenticated read customer_emails" on customer_emails for select to authenticated using (true);
  end if;
end $$;

-- Live updates for the web conversation view.
do $$ begin
  begin
    alter publication supabase_realtime add table customer_emails;
  exception when duplicate_object then null;
  end;
end $$;
