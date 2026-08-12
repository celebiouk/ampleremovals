-- Customer conversation inbox (SMS + WhatsApp via Twilio).
-- One conversation per customer PHONE (normalised E.164) so SMS + WhatsApp from
-- the same number live in ONE thread. customer_id links it to a customer when we
-- can match the number; null = "unassigned / unknown contact".

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete set null,
  contact_phone text not null,                 -- normalised E.164 (the customer's number)
  last_message_at timestamptz,
  last_message_preview text,
  last_message_direction text,                 -- inbound | outbound
  last_channel text,                           -- sms | whatsapp
  unread_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists conversations_contact_phone_key on conversations (contact_phone);
create index if not exists conversations_customer_id_idx on conversations (customer_id);
create index if not exists conversations_last_message_at_idx on conversations (last_message_at desc nulls last);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  twilio_sid text unique,                      -- idempotency key (webhooks can repeat)
  channel text not null,                       -- sms | whatsapp
  direction text not null,                     -- inbound | outbound
  from_number text,
  to_number text,
  body text,
  status text,                                 -- queued|sent|delivered|failed|undelivered|read|received
  error_message text,
  media_urls jsonb,                            -- array of media URLs (mms / whatsapp media)
  read_at timestamptz,
  sent_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists messages_conversation_created_idx on messages (conversation_id, created_at);
create index if not exists messages_customer_id_idx on messages (customer_id);
create index if not exists messages_twilio_sid_idx on messages (twilio_sid);
create index if not exists messages_unread_idx on messages (conversation_id) where direction = 'inbound' and read_at is null;

-- Match inbound numbers to customers quickly.
create index if not exists customers_phone_idx on customers (phone);

-- RLS: writes happen server-side via the service role (bypasses RLS). Logged-in
-- admins may read (needed for Supabase Realtime subscriptions in the dashboard).
alter table conversations enable row level security;
alter table messages enable row level security;
drop policy if exists "authenticated read conversations" on conversations;
drop policy if exists "authenticated read messages" on messages;
create policy "authenticated read conversations" on conversations for select to authenticated using (true);
create policy "authenticated read messages" on messages for select to authenticated using (true);

-- Live updates in the dashboard without a refresh.
do $$
begin
  begin execute 'alter publication supabase_realtime add table conversations'; exception when duplicate_object then null; end;
  begin execute 'alter publication supabase_realtime add table messages'; exception when duplicate_object then null; end;
end $$;

notify pgrst, 'reload schema';
