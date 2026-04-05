-- Jurnal sincronizare SmartBill (succes / eșec / omis) — vizibil utilizatorului în Setări
create table if not exists public.smartbill_sync_log (
  id uuid primary key default gen_random_uuid(),
  accountant_id uuid not null references public.accountants (id) on delete cascade,
  stripe_checkout_session_id text,
  stripe_invoice_id text,
  status text not null check (status in ('skipped', 'success', 'error')),
  error_message text,
  smartbill_series text,
  smartbill_number text,
  detail text,
  created_at timestamptz not null default now()
);

create index if not exists smartbill_sync_log_accountant_created_idx
  on public.smartbill_sync_log (accountant_id, created_at desc);

comment on table public.smartbill_sync_log is 'Istoric încercări emitere factură SmartBill după Stripe; pentru diagnostic';

alter table public.smartbill_sync_log enable row level security;

create policy "smartbill_sync_log_select_own" on public.smartbill_sync_log
  for select using (accountant_id = auth.uid());
