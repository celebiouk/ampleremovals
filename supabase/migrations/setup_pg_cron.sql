-- ============================================================================
-- Frequent schedulers via Supabase pg_cron (Vercel Hobby only allows daily crons)
--
-- Drives the sub-daily endpoints that can't live on Vercel Hobby:
--   • /api/cron/eta-engine     — every minute (driver-app smart-ETA Calls 2/3)
--   • /api/cron/quote-followup — hourly       (quote reminder ladder)
--   • /api/cron/lead-reminders — hourly       (new-lead reminder ladder)
--
-- Both endpoints are protected by CRON_SECRET (Bearer). The secret + the app's
-- base URL are read from Supabase Vault so nothing sensitive lives in git.
--
-- ── ONE-TIME SETUP (do this BEFORE running this file) ───────────────────────
-- Add two Vault secrets (Dashboard → Project Settings → Vault → New secret,
-- or run the two lines below in the SQL editor with your real values):
--
--   select vault.create_secret('https://www.ampleremovals.com', 'app_base_url');
--   select vault.create_secret('<YOUR_CRON_SECRET>',            'cron_secret');
--
-- (app_base_url = your production domain, no trailing slash.)
-- ============================================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Calls one of our cron endpoints with the Bearer secret, reading both the base
-- URL and the secret from Vault. SECURITY DEFINER so the scheduled job (running
-- as the job owner) can read vault.decrypted_secrets.
create or replace function public.invoke_cron(path text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  base_url text;
  secret   text;
begin
  select decrypted_secret into base_url from vault.decrypted_secrets where name = 'app_base_url' limit 1;
  select decrypted_secret into secret   from vault.decrypted_secrets where name = 'cron_secret'  limit 1;

  if base_url is null or secret is null then
    raise notice 'invoke_cron(%): missing Vault secret app_base_url/cron_secret — skipping', path;
    return;
  end if;

  perform net.http_get(
    url     := base_url || path,
    headers := jsonb_build_object('Authorization', 'Bearer ' || secret)
  );
end;
$$;

-- (Re)schedule jobs idempotently.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'eta-engine')     then perform cron.unschedule('eta-engine');     end if;
  if exists (select 1 from cron.job where jobname = 'quote-followup') then perform cron.unschedule('quote-followup'); end if;
  if exists (select 1 from cron.job where jobname = 'lead-routing')   then perform cron.unschedule('lead-routing');   end if;
  if exists (select 1 from cron.job where jobname = 'late-check')     then perform cron.unschedule('late-check');     end if;
  if exists (select 1 from cron.job where jobname = 'lead-reminders') then perform cron.unschedule('lead-reminders'); end if;
end $$;

select cron.schedule('eta-engine',     '* * * * *',  $$ select public.invoke_cron('/api/cron/eta-engine');     $$);
select cron.schedule('quote-followup', '0 * * * *',  $$ select public.invoke_cron('/api/cron/quote-followup'); $$);
select cron.schedule('lead-routing',   '*/15 * * * *', $$ select public.invoke_cron('/api/cron/lead-routing'); $$);
select cron.schedule('late-check',     '*/15 * * * *', $$ select public.invoke_cron('/api/cron/late-check');   $$);
select cron.schedule('lead-reminders', '0 * * * *',  $$ select public.invoke_cron('/api/cron/lead-reminders'); $$);
